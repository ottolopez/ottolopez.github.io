import os
import datetime
import math

def get_file_size(size_bytes):
    """Return a human-readable file size from bytes."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    size_name = ("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_name[i]}"

def generate_index_for_dir(dir_path):
    """Generates an index.html file for a given directory."""
    depth = 0
    if dir_path != '.':
        depth = dir_path.count(os.sep) + 1

    # Determine relative path for CSS
    css_path = '../' * depth + 'style.css'

    # Create a title for the page
    page_title = f"Index of /{dir_path.replace('.', '', 1).lstrip('/')}"
    if page_title.endswith('/'):
        page_title = page_title[:-1]
    if not page_title.endswith('/'):
        page_title += '/'


    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{page_title}</title>
    <link rel="stylesheet" href="{css_path}">
</head>
<body>
    <h1>{page_title}</h1>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Last modified</th>
                <th>Size</th>
            </tr>
        </thead>
        <tbody>
"""

    entries = []
    # Add parent directory link if not in root
    if dir_path != '.':
        entries.append('            <tr>\n                <td><a href="../">Parent Directory</a></td>\n                <td>-</td>\n                <td>-</td>\n            </tr>')

    # Sort entries: directories first, then files, all alphabetically
    sorted_entries = sorted(os.scandir(dir_path), key=lambda e: (not e.is_dir(), e.name.lower()))

    for entry in sorted_entries:
        # Exclude certain files and directories from the listing
        if entry.name.startswith('.') or entry.name in ['index.html', os.path.basename(__file__), 'style.css']:
            continue
        if dir_path == '.' and entry.name in ['.git', '.github']:
            continue

        mtime = datetime.datetime.fromtimestamp(entry.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')

        if entry.is_dir():
            size = "-"
            name = f"{entry.name}/"
            href = f"{entry.name}"
        else:
            size = get_file_size(entry.stat().st_size)
            name = entry.name
            href = entry.name

        entries.append(f'            <tr>\n                <td><a href="{href}">{name}</a></td>\n                <td>{mtime}</td>\n                <td>{size}</td>\n            </tr>')

    html_content += "\n".join(entries)
    html_content += """
        </tbody>
    </table>
</body>
</html>
"""

    with open(os.path.join(dir_path, "index.html"), "w") as f:
        f.write(html_content)

def main():
    """Walk through directories and generate index files."""
    excluded_dirs = ['.git', '.github', 'jules-scratch', 'bible']
    for root, dirs, _ in os.walk('.', topdown=True):
        dirs[:] = [d for d in dirs if d not in excluded_dirs]
        generate_index_for_dir(root)

if __name__ == "__main__":
    main()
