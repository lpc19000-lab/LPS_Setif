const fs = require('fs');
const files = [
    'app/[locale]/admin/actions/order.ts',
    'app/[locale]/admin/actions/product.ts',
    'app/admin/actions/order.ts',
    'app/admin/actions/product.ts',
    'services/category-service.ts',
    'services/collection-service.ts',
    'services/order-service.ts',
    'services/product-service.ts'
];
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/revalidateTag\s*\(\s*([^,)]+)\s*\)/g, 'revalidateTag($1, "max")');
    fs.writeFileSync(f, content);
    console.log(`Updated ${f}`);
});
