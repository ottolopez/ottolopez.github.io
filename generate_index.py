import os
import datetime
import math

def get_file_size(size_bytes):
    if size_bytes == 0:
        return "0B"
    size_name = ("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_name[i]}"

def generate_html(path="."):
    html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Index of /</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Index of /</h1>
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

    entries = ['            <tr>\n                <td><a href="../">Parent Directory</a></td>\n                <td>-</td>\n                <td>-</td>\n            </tr>']
    for entry in os.scandir(path):
        if entry.name.startswith('.') or entry.name == 'index.html':
            continue

        mtime = datetime.datetime.fromtimestamp(entry.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')

        if entry.is_dir():
            size = "-"
            name = f"{entry.name}/"
            href = f"{entry.name}/"
        else:
            size = get_file_size(entry.stat().st_size)
            name = entry.name
            href = entry.name

        entries.append(f'            <tr>\n                <td><a href="{href}">{name}</a></td>\n                <td>{mtime}</td>\n                <td>{size}</td>\n            </tr>')

    html += "\n".join(entries)
    html += """
        </tbody>
    </table>
</body>
</html>
"""

    with open("index.html", "w") as f:
        f.write(html)

if __name__ == "__main__":
    generate_html()
