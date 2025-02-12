---
layout: default
title: QR Code Generator
---

<div class="post">
   <div class="container">
        <h1>QR Code Generator</h1>
        <input type="text" id="text" placeholder="Enter full URL INCLUDING https:// "">
        <br>
        <button onclick="generateQR()">Generate QR Code</button>
        <button onclick="downloadQR()">Download QR Code</button>
        <div id="qrcode"></div>
    </div>

    <script>
        let qrcode = null;

        function generateQR() {
            const text = document.getElementById('text').value;
            document.getElementById('qrcode').innerHTML = '';
            
            qrcode = new QRCode(document.getElementById('qrcode'), {
                text: text,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }

        function downloadQR() {
            if (!qrcode) {
                alert('Please generate a QR code first!');
                return;
            }

            const canvas = document.querySelector('#qrcode canvas');
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = image;
            link.click();
        }

        // Generate initial QR code
        generateQR();
    </script>
</div>
