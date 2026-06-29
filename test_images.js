fetch('http://localhost:3000/api/products?storeId=47ced718-4b74-45d7-a95e-34da98308723')
  .then(r => r.json())
  .then(data => {
    console.log("Got products:", data.products.length);
    if(data.products.length > 0) {
       let p = data.products[0];
       console.log("First product name:", p.name);
       console.log("images type:", typeof p.images, Array.isArray(p.images));
       console.log("mainImage mapped:", p.images?.[0]?.thumbnail || p.images?.[0]?.full || 'FALLBACK');
    }
  }).catch(e => console.error(e));
