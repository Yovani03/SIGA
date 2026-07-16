import re

file_path = r'c:\Autrotransportes\frontend\src\pages\Combustibles.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the broken block at the end
# The broken block starts at `      ) : activeTab === 'evidencia' ? (` (line 1905)
# and goes until `      ) : null}` (line 2003)
# It's right after `      )}` (line 1904) and before `    </div>\n  );\n};\n\nexport default Combustibles;`

evidencia_block = re.search(r"(\s+\) : activeTab === 'evidencia' \? \([\s\S]*?\) : null})", content)
if not evidencia_block:
    print("Could not find evidencia block at the end.")
else:
    block_text = evidencia_block.group(1)
    # Remove it from the end
    content = content.replace(block_text, "")
    
    # 2. Insert it at the correct place
    # The correct place is right before `      )}\n      \n      {/* Block Details Modal */}`
    # Which corresponds to line 1673.
    target = "      )}\n      \n      {/* Block Details Modal */}"
    if target in content:
        content = content.replace(target, block_text + "\n" + target)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fix applied successfully.")
    else:
        print("Could not find the target location for insertion.")
