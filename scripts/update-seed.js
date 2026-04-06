import fs from 'fs';

let content = fs.readFileSync('scripts/seed-bicolano-market.js', 'utf-8');
content = content.replace("const { data: product } = await supabase.from('products').upsert({", "const { data: product, error: prodErr } = await supabase.from('products').upsert({");
content = content.replace("if (product) {", "if (prodErr) console.error('PROD ERR:', prod.name, prodErr);\n        if (product) {");
fs.writeFileSync('scripts/seed-bicolano-market.js', content);
