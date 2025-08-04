import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FieldData {
  classes: string[];
  label: string;
  labelFor: string;
  id: string;
  name: string;
  type: string;
  required: boolean;
  potentialIdentifiers: string[];
  pardotId?: string;
  formId?: string;
}

interface FieldMapping {
  enabled: boolean;
  follozeField: string;
  customField: string;
  pardotField: string;
  availableIdentifiers: string[];
}

interface InitialValueConfig {
  enabled: boolean;
  pardotField: string;
}

const PardotFieldAnalyzer = () => {
  const [inputHtml, setInputHtml] = useState('');
  const [fields, setFields] = useState<FieldData[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<number, FieldMapping>>({});
  const [initialValuesConfig, setInitialValuesConfig] = useState<Record<string, InitialValueConfig>>({});
  const [generatedCode, setGeneratedCode] = useState('');
  const [completeHtml, setCompleteHtml] = useState('');
  const [formActionUrl, setFormActionUrl] = useState('');

  // Common Folloze field options
  const follozeFields = [
    { value: '', label: 'Do not map' },
    { value: 'email', label: 'Email' },
    { value: 'name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'company', label: 'Company' },
    { value: 'headline', label: 'Job Title' },
    { value: 'note', label: 'Message/Note' },
    { value: 'phone', label: 'Phone' },
    { value: 'custom', label: 'Custom Field...' }
  ];

  // Initial values configuration options
  const initialValueTypes = [
    {
      category: 'UTM Parameters',
      options: [
        { key: 'utm_campaign', label: 'UTM Campaign', code: '(new URL(location.href)).searchParams.get(\'utm_campaign\')' },
        { key: 'utm_source', label: 'UTM Source', code: '(new URL(location.href)).searchParams.get(\'utm_source\')' },
        { key: 'utm_medium', label: 'UTM Medium', code: '(new URL(location.href)).searchParams.get(\'utm_medium\')' },
        { key: 'utm_term', label: 'UTM Term', code: '(new URL(location.href)).searchParams.get(\'utm_term\')' },
        { key: 'utm_content', label: 'UTM Content', code: '(new URL(location.href)).searchParams.get(\'utm_content\')' }
      ]
    },
    {
      category: 'Board Metadata',
      options: [
        { key: 'board_id', label: 'Board ID', code: 'FollozeState.initialState.board.id' },
        { key: 'board_url', label: 'Board URL', code: 'FollozeState.baseRoute' },
        { key: 'board_name', label: 'Board Name', code: 'FollozeState.initialState.board.name' }
      ]
    },
    {
      category: 'Lead Data Auto-Population',
      options: [
        { key: 'lead_name', label: 'Lead First Name', code: 'FollozeState.initialState.lead.name' },
        { key: 'lead_email', label: 'Lead Email', code: 'FollozeState.initialState.lead.email' },
        { key: 'lead_company', label: 'Lead Company', code: 'FollozeState.initialState.lead.company' },
        { key: 'lead_title', label: 'Lead Title', code: 'FollozeState.initialState.lead.headline' }
      ]
    }
  ];

  // Smart mapping suggestions based on field names/labels
  const suggestMapping = (field) => {
    const label = field.label.toLowerCase();
    const name = field.name.toLowerCase();
    
    if (label.includes('email') || name.includes('email')) return 'email';
    if (label.includes('first') && label.includes('name') || name.includes('first_name')) return 'name';
    if (label.includes('last') && label.includes('name') || name.includes('last_name')) return 'last_name';
    if (label.includes('company') || name.includes('company')) return 'company';
    if (label.includes('job') || label.includes('title') || name.includes('job_title')) return 'headline';
    if (label.includes('phone') || name.includes('phone')) return 'phone';
    if (label.includes('message') || label.includes('comment') || name.includes('message')) return 'note';
    
    return '';
  };

  // Get all possible field identifiers for a field
  const getFieldIdentifiers = (field) => {
    const identifiers = [];
    
    // Add all potential identifiers
    if (field.name) identifiers.push(field.name);
    if (field.id && field.id !== field.name) identifiers.push(field.id);
    if (field.labelFor && field.labelFor !== field.name && field.labelFor !== field.id) {
      identifiers.push(field.labelFor);
    }
    
    // Add potential identifiers from classes (but filter out common ones)
    field.potentialIdentifiers?.forEach(id => {
      if (!identifiers.includes(id)) {
        identifiers.push(id);
      }
    });
    
    return identifiers.filter(Boolean);
  };

  // Smart guess for the best field identifier
  const guessBestFieldIdentifier = (field) => {
    const identifiers = getFieldIdentifiers(field);
    if (identifiers.length === 0) return '';
    
    // Scoring system - prefer simpler, more semantic field names
    const scoreIdentifier = (identifier) => {
      let score = 0;
      const id = identifier.toLowerCase();
      
      // Prefer common field patterns
      if (id === 'first_name' || id === 'firstname') score += 100;
      if (id === 'last_name' || id === 'lastname') score += 100;
      if (id === 'email') score += 100;
      if (id === 'company') score += 100;
      if (id === 'phone') score += 100;
      if (id === 'job_title' || id === 'title') score += 100;
      if (id === 'message') score += 100;
      
      // Prefer shorter identifiers
      score += Math.max(0, 50 - identifier.length);
      
      // Penalize complex IDs with numbers and underscores
      if (/^\d+_\d+pi_\d+_\d+/.test(identifier)) score -= 50;
      if (identifier.includes('pi_')) score -= 20;
      
      // Prefer identifiers that match the field label
      const label = field.label.toLowerCase().replace(/[^a-z]/g, '');
      if (id.replace(/[^a-z]/g, '').includes(label)) score += 30;
      
      return score;
    };
    
    // Find the highest scoring identifier
    let bestIdentifier = identifiers[0];
    let bestScore = scoreIdentifier(bestIdentifier);
    
    identifiers.forEach(identifier => {
      const score = scoreIdentifier(identifier);
      if (score > bestScore) {
        bestScore = score;
        bestIdentifier = identifier;
      }
    });
    
    return bestIdentifier;
  };

  const extractFields = (html) => {
    // Extract form action URL for complete HTML assembly
    const formMatch = html.match(/<form[^>]*action="([^"]*)"[^>]*>/i);
    const extractedActionUrl = formMatch ? formMatch[1] : '';
    setFormActionUrl(extractedActionUrl);

    // Find all form-field blocks
    const fieldRegex = /class="form-field[^"]*"[^>]*>([\s\S]*?)<\/p>/g;
    const matches = [...html.matchAll(fieldRegex)];
    
    const extractedFields: FieldData[] = matches.map(match => {
      const fieldHtml = match[0];
      
      // Get all classes
      const classMatch = fieldHtml.match(/class="([^"]*)"/);
      const classes = classMatch ? classMatch[1].split(/\s+/) : [];
      
      // Get label text and for attribute
      const labelMatch = fieldHtml.match(/<label[^>]*?>(.*?)<\/label>/);
      const labelForMatch = fieldHtml.match(/<label[^>]*?for="([^"]*)"[^>]*?>/);
      
      // Initialize field data
      const fieldData: FieldData = {
        classes: classes.filter(c => c !== 'form-field'),
        label: labelMatch ? labelMatch[1].trim() : '',
        labelFor: labelForMatch ? labelForMatch[1] : '',
        id: '',
        name: '',
        type: 'text',
        required: fieldHtml.includes('required'),
        potentialIdentifiers: classes.filter(c => 
          !['form-field', 'required', 'pd-text', 'pd-select', 'pd-checkbox', 'pd-hidden', 'hidden',
            'form-col-1', 'form-col-2', 'form-col-full'].includes(c)
        )
      };
      
      // Get input/select details
      const inputMatch = fieldHtml.match(/<(input|select)[^>]*?>/);
      if (inputMatch) {
        const inputHtml = inputMatch[0];
        
        // Get input ID
        const idMatch = inputHtml.match(/id="([^"]*)"/);
        fieldData.id = idMatch ? idMatch[1] : '';
        
        // Get input name
        const nameMatch = inputHtml.match(/name="([^"]*)"/);
        fieldData.name = nameMatch ? nameMatch[1] : '';
        
        // Get input type
        const typeMatch = inputHtml.match(/type="([^"]*)"/);
        fieldData.type = typeMatch ? typeMatch[1] : 'select';
      }
      
      // Extract field name from input name
      if (fieldData.name) {
        const nameSegments = fieldData.name.split('pi_');
        if (nameSegments.length > 1) {
          fieldData.pardotId = nameSegments[0];
          fieldData.formId = nameSegments[1].split('_')[0];
        }
      }
      
      return fieldData;
    });
    
    setFields(extractedFields);
    
    // Initialize field mappings with smart suggestions
    const initialMappings = {};
    extractedFields.forEach((field, index) => {
      const suggestion = suggestMapping(field);
      const bestIdentifier = guessBestFieldIdentifier(field);
      const availableIdentifiers = getFieldIdentifiers(field);
      
      initialMappings[index] = {
        enabled: suggestion !== '',
        follozeField: suggestion,
        customField: '',
        pardotField: bestIdentifier,
        availableIdentifiers: availableIdentifiers
      };
    });
    setFieldMappings(initialMappings);
  };

  const updateFieldMapping = (fieldIndex, property, value) => {
    setFieldMappings(prev => ({
      ...prev,
      [fieldIndex]: {
        ...prev[fieldIndex],
        [property]: value
      }
    }));
  };

  const updateInitialValueConfig = (key, property, value) => {
    setInitialValuesConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [property]: value
      }
    }));
  };

  const getAllPardotFields = () => {
    const allFields = [];
    fields.forEach((field, index) => {
      const identifiers = getFieldIdentifiers(field);
      identifiers.forEach(identifier => {
        if (!allFields.find(f => f.value === identifier)) {
          allFields.push({
            value: identifier,
            label: `${field.label} (${identifier})`
          });
        }
      });
    });
    return [{ value: '', label: 'Select Pardot field...' }, ...allFields];
  };

  const generateCode = () => {
    // Generate field mappings
    const mappedFields = Object.entries(fieldMappings)
      .filter(([_, mapping]) => mapping.follozeField && mapping.follozeField !== '')
      .map(([fieldIndex, mapping]) => {
        const field = fields[parseInt(fieldIndex)];
        const pardotKey = mapping.pardotField || field.name || field.id;
        const follozeKey = mapping.follozeField === 'custom' ? mapping.customField : mapping.follozeField;
        
        if (!follozeKey) return null;
        
        return `      ${follozeKey}: values.${pardotKey}`;
      })
      .filter(Boolean);

    // Generate initial values
    const enabledInitialValues = Object.entries(initialValuesConfig)
      .filter(([_, config]) => config.enabled && config.pardotField)
      .map(([key, config]) => {
        const option = initialValueTypes
          .flatMap(type => type.options)
          .find(opt => opt.key === key);
        
        if (!option) return null;
        
        return `  ${config.pardotField}: ${option.code}`;
      })
      .filter(Boolean);

    const initialValuesCode = enabledInitialValues.length > 0 
      ? `const initialValues = {
${enabledInitialValues.join(',\n')}
}`
      : 'const initialValues = {}';

    const code = `${initialValuesCode}

function submitForm(values) {
  div.dispatchEvent(new CustomEvent("flz-submit", {
    detail: {
      ...values,
${mappedFields.join(',\n')}
    }
  }));
}`;

    setGeneratedCode(code);

    // Generate complete HTML for Folloze
    if (formActionUrl) {
      const initialValuesForScript = enabledInitialValues.length > 0 
        ? `{
${enabledInitialValues.join(',\n')}
}`
        : '{}';

      const submitFormMappings = mappedFields.length > 0 
        ? `,
${mappedFields.join(',\n')}`
        : '';

      const completeHtmlOutput = `<iframe src="${formActionUrl}" width="100%" height="500" type="text/html" frameborder="0" allowTransparency="true" style="border: 0"></iframe>

<script>
(function () {
  const slotId = document.currentScript.getAttribute('slot-id');
  const div = document.getElementById(slotId);
  const formId = slotId;
  const iframe = div.querySelector('iframe');
  const url = new URL(iframe.src);
  url.searchParams.set('folloze_external_form', formId);
  iframe.src = url.href;

  const initialValues = ${initialValuesForScript}

  iframe.addEventListener('load', function () {
    div.dispatchEvent(new CustomEvent("flz-form-loaded", {}));
    requestHeight();
    sendInitialValues();
  }, { once: true});

  function submitForm(values) {
    div.dispatchEvent(new CustomEvent("flz-submit", {
      detail: {
        ...values${submitFormMappings}
      }
    }));
  }

  function postMessage(data) {
    iframe.contentWindow.postMessage(data, '*'); // url.origin
  }

  function requestHeight(){
    postMessage({ formId, eventId: 'folloze_external_form', type: 'page_dimensions_request' });
  }

  function sendInitialValues() {
    postMessage({ formId, values: initialValues, eventId: 'folloze_external_form', type: 'initial_data' });
  }

  let submitRequestTimeout;
  let abortSignal = new AbortController();

  window.addEventListener('message', (event) => {
    if (!event.data || event.data.eventId !== 'folloze_external_form' || event.data.formId !== formId) return;
    console.log(event.data);

    if (event.data.type === 'page_dimensions') {
      iframe.height = event.data.height;
    }

    if (event.data.type === 'initial_data') {
      sendInitialValues();
    }

    if (event.data.type === 'submit') {
      const values = event.data.values;
      postMessage({ formId, eventId: 'folloze_external_form', type: 'submit_continue' });
      clearTimeout(submitRequestTimeout);

      iframe.addEventListener('load', function () {
        submitRequestTimeout = setTimeout(() => {
          submitForm(values);
        }, 200);
      }, { once: true, signal: abortSignal.signal });
    }

    if (event.data.type === 'cancel_submit') {
      clearTimeout(submitRequestTimeout);
      abortSignal.abort();
      abortSignal = new AbortController();
    }
  });
})();
</script>`;

      setCompleteHtml(completeHtmlOutput);
    }
  };

  // Auto-generate code when mappings change
  useEffect(() => {
    if (Object.keys(fieldMappings).length > 0 || formActionUrl) {
      generateCode();
    }
  }, [fieldMappings, initialValuesConfig, formActionUrl]);

  const emailTemplate = `Subject: Pardot-Folloze External Form Integration - Technical Preparation Required

We are excited to help you implement the Pardot-Folloze external form integration. To ensure a smooth setup process, we need your assistance with some technical preparation in your Pardot environment.

Required Form Fields Setup:

Standard Fields (Required):
- Email - This field is mandatory and must be included in your Pardot form

Standard Fields (Optional):
Consider which of these standard fields you would like to include in your form:
- First Name
- Last Name  
- Company
- Job Title/Headline
- Phone
- Message/Note

Custom Fields:
Think through any custom fields you would like to capture through this form (e.g., industry, company size, budget, etc.). Please create these fields in your Pardot form as needed.

Board Metadata Fields (Recommended):
We recommend creating the following hidden fields in your Pardot form to capture board tracking data:
- Board ID
- Board Name  
- Board URL

UTM Tracking Fields:
Please create the following hidden fields in Pardot to capture campaign attribution:
- UTM Campaign
- UTM Source
- UTM Medium
- UTM Term
- UTM Content

Consider if you need any additional custom UTM fields beyond the standard ones listed above.

Pardot Script Implementation:
You will need to add the following script to your Pardot form's "Below Form" section:

<script src="https://cdn.folloze.com/external-forms/pardot-script.js"></script>

Next Steps:
1. Please review the field requirements above and create the necessary fields in your Pardot form
2. Think through which fields you would like to include for your specific campaign goals
3. Reply to this email with the URL to your published Pardot external form
4. If you would prefer a quick setup call to walk through the configuration together, let me know and we can arrange that

Once I have your form URL, I can analyze the form structure and move forward with the integration. Please feel free to reach out if you have any questions about these requirements.`;

  const handleEmailClick = (e) => {
    const range = document.createRange();
    range.selectNodeContents(e.currentTarget);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Step 1 - Email Template */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1 - Email the Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click on the email template below to select all text, then use Ctrl+C to copy.
            </p>
            <div 
              onClick={handleEmailClick}
              className="bg-muted border border-border rounded p-4 cursor-pointer hover:bg-directory-hover transition-colors font-mono text-sm leading-relaxed whitespace-pre-wrap select-text overflow-y-auto"
              style={{ userSelect: 'text', height: '4.5rem' }}
            >
              {emailTemplate}
            </div>
          </CardContent>
        </Card>

        {/* Step 2 - Form Analyzer */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2 - Parse the Pardot External Form's HTML</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <textarea 
                className="w-full h-48 p-2 border border-border rounded bg-background text-foreground"
                placeholder="Paste your Pardot form HTML here..."
                value={inputHtml}
                onChange={(e) => {
                  setInputHtml(e.target.value);
                  extractFields(e.target.value);
                }}
              />
              

              {fields.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Step 3 - Field Mapping Configuration</h3>
                      <p className="text-sm text-muted-foreground">
                        Select which Pardot fields to map to Folloze fields. 
                        Mapped fields: {Object.values(fieldMappings).filter(m => m?.follozeField && m?.follozeField !== '').length} of {fields.length}
                      </p>
                    </div>
                    <button 
                      onClick={generateCode}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                      Regenerate Code
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-11 gap-4 items-center py-2 border-b border-border font-medium text-sm text-muted-foreground">
                      <div className="col-span-3">Pardot Field (Source)</div>
                      <div className="col-span-1 text-center">Maps to</div>
                      <div className="col-span-3">Folloze Field (Target)</div>
                      <div className="col-span-4">Folloze Custom Field Override</div>
                    </div>
                    
                    {fields.map((field, index) => (
                      <div key={index} className="p-4 border border-border rounded bg-card">
                        <div className="grid grid-cols-11 gap-4 items-center">
                          <div className="col-span-3">
                            <div className="space-y-1">
                              <div className="font-medium text-sm">{field.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {field.type} field
                                {(fieldMappings[index]?.availableIdentifiers || []).length > 1 && (
                                  <span className="text-primary"> • {(fieldMappings[index]?.availableIdentifiers || []).length} options</span>
                                )}
                              </div>
                              <select
                                value={fieldMappings[index]?.pardotField || ''}
                                onChange={(e) => updateFieldMapping(index, 'pardotField', e.target.value)}
                                disabled={!fieldMappings[index]?.follozeField || fieldMappings[index]?.follozeField === ''}
                                className="w-full p-1 border border-border rounded text-xs disabled:bg-muted bg-background text-foreground"
                              >
                                {(fieldMappings[index]?.availableIdentifiers || []).map((identifier, idIndex) => (
                                  <option key={identifier} value={identifier}>
                                    {idIndex === 0 ? '⭐ ' : ''}{identifier}
                                    {idIndex === 0 ? ' (recommended)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          <div className="col-span-1 text-center text-muted-foreground">→</div>
                          
                          <div className="col-span-3">
                            <select
                              value={fieldMappings[index]?.follozeField || ''}
                              onChange={(e) => updateFieldMapping(index, 'follozeField', e.target.value)}
                              className="w-full p-2 border border-border rounded text-sm bg-background text-foreground"
                            >
                              {follozeFields.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="col-span-4">
                            {fieldMappings[index]?.follozeField === 'custom' ? (
                              <input
                                type="text"
                                placeholder="Enter custom Folloze field name"
                                value={fieldMappings[index]?.customField || ''}
                                onChange={(e) => updateFieldMapping(index, 'customField', e.target.value)}
                                className="w-full p-2 border border-border rounded text-sm bg-background text-foreground"
                              />
                            ) : (
                              <input
                                type="text"
                                placeholder=""
                                value=""
                                disabled
                                className="w-full p-2 border border-border rounded text-sm bg-muted"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fields.length > 0 && (
                <div className="mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Step 4 - Initial Values Configuration Builder</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure UTM capture, board metadata, and form pre-population. 
                      Enabled: {Object.values(initialValuesConfig).filter(config => config?.enabled).length} parameters
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    {initialValueTypes.map((category, categoryIndex) => (
                      <div key={categoryIndex} className="border border-border rounded-lg p-4 bg-card">
                        <h4 className="font-medium text-base mb-3 text-primary">{category.category}</h4>
                        <div className="space-y-3">
                          {category.options.map((option, optionIndex) => (
                            <div key={option.key} className="grid grid-cols-12 gap-4 items-center py-2 border-b border-border last:border-b-0">
                              <div className="col-span-1">
                                <input
                                  type="checkbox"
                                  checked={initialValuesConfig[option.key]?.enabled || false}
                                  onChange={(e) => updateInitialValueConfig(option.key, 'enabled', e.target.checked)}
                                  className="w-4 h-4"
                                />
                              </div>
                              <div className="col-span-3">
                                <div className="font-medium text-sm">{option.label}</div>
                                <div className="text-xs text-muted-foreground font-mono">{option.key}</div>
                              </div>
                              <div className="col-span-1 text-center text-muted-foreground">→</div>
                              <div className="col-span-4">
                                <select
                                  value={initialValuesConfig[option.key]?.pardotField || ''}
                                  onChange={(e) => updateInitialValueConfig(option.key, 'pardotField', e.target.value)}
                                  disabled={!initialValuesConfig[option.key]?.enabled}
                                  className="w-full p-2 border border-border rounded text-sm disabled:bg-muted bg-background text-foreground"
                                >
                                  {getAllPardotFields().map(field => (
                                    <option key={field.value} value={field.value}>
                                      {field.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-3">
                                <div className="text-xs text-muted-foreground font-mono bg-muted p-1 rounded">
                                  {option.code.length > 40 ? `${option.code.substring(0, 40)}...` : option.code}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(generatedCode || completeHtml) && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Step 5 - Generated Code Output</h3>
                    <button 
                      onClick={() => navigator.clipboard.writeText(completeHtml)}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 text-sm transition-colors"
                      disabled={!completeHtml}
                    >
                      Copy Complete HTML
                    </button>
                  </div>

                  {formActionUrl && (
                    <div className="mb-4 p-3 bg-secondary/50 border border-secondary rounded">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium">✓ Form Action URL Detected:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-foreground min-w-fit">URL:</label>
                          <input
                            type="text"
                            value={formActionUrl}
                            onChange={(e) => setFormActionUrl(e.target.value)}
                            className="flex-1 p-2 text-sm border border-border rounded font-mono bg-background text-foreground"
                            placeholder="Enter Pardot form action URL..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {!formActionUrl && fields.length > 0 && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-destructive font-medium">⚠ No Form Action URL Found:</span>
                          <span className="text-sm text-muted-foreground">
                            Paste complete Pardot form HTML or manually enter the form action URL below
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-foreground min-w-fit">Manual URL:</label>
                          <input
                            type="text"
                            value={formActionUrl}
                            onChange={(e) => setFormActionUrl(e.target.value)}
                            className="flex-1 p-2 text-sm border border-border rounded font-mono bg-background text-foreground"
                            placeholder="Enter Pardot form action URL manually..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {completeHtml && (
                    <div className="mb-6">
                      <div className="mb-2">
                        <h4 className="text-md font-semibold text-primary">Complete HTML Code Assembler</h4>
                        <p className="text-sm text-muted-foreground">
                          Ready-to-use HTML for Folloze External Form configuration. This includes the iframe and complete integration script.
                        </p>
                      </div>
                      <div className="bg-primary text-primary-foreground p-4 rounded overflow-x-auto max-h-96">
                        <pre className="text-sm">
                          <code>{completeHtml}</code>
                        </pre>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Copy this complete HTML and paste it into the "Form HTML" field in Folloze &gt; Company Admin &gt; Forms &gt; External.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PardotFieldAnalyzer;