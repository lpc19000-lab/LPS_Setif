
import re
import json

def generate_sql():
    with open('data/algeria-locations.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the array content
    array_match = re.search(r'algeriaLocations: WilayaData\[\] = (\[.*\]);', content, re.DOTALL)
    if not array_match:
        print("Could not find algeriaLocations array")
        return

    json_str = array_match.group(1)
    # Basic cleanup to make it JSON-ish
    json_str = re.sub(r'//.*', '', json_str)
    
    try:
        data = json.loads(json_str)
    except Exception as e:
        # If it's not perfect JSON (e.g. trailing commas, missing quotes), try a looser approach
        print(f"JSON load failed, attempting regex extraction: {e}")
        data = []
        wilaya_blocks = re.findall(r'\{\s*"id":\s*"(\d+)",\s*"name":\s*"([^"]+)",\s*"communes":\s*\[(.*?)\]\s*\}', json_str, re.DOTALL)
        for w_id, w_name, c_text in wilaya_blocks:
            communes = re.findall(r'"([^"]+)"', c_text)
            data.append({"id": w_id, "name": w_name, "communes": communes})

    sql = "-- Full Algerian Communes Seed\n"
    sql += "TRUNCATE TABLE communes CASCADE;\n"
    sql += "INSERT INTO communes (wilaya_id, name) VALUES\n"
    
    values = []
    for wilaya in data:
        w_id = int(wilaya['id'])
        for commune in wilaya['communes']:
            escaped_name = commune.replace("'", "''")
            values.append(f"({w_id}, '{escaped_name}')")
            
    sql += ",\n".join(values) + ";\n"
    
    with open('full_communes_seed.sql', 'w', encoding='utf-8') as f:
        f.write(sql)
    print(f"Generated seed for {len(values)} communes")

if __name__ == "__main__":
    generate_sql()
