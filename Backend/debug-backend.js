const axios = require('axios');

async function checkBackend() {
    try {
        console.log('Checking GET http://localhost:4455/api/rooms ...');
        const res = await axios.get('http://localhost:4455/api/rooms');
        console.log('Status:', res.status);
        if (res.data && res.data.data) {
            console.log('Rooms count:', res.data.data.length);
            res.data.data.forEach(r => {
                console.log(`Room ${r.id}: ${r.number} (${r.type}) - Image URL length: ${r.image ? r.image.length : 0}`);
                if (r.images) {
                    console.log(`  Gallery images: ${r.images.length}`);
                    r.images.forEach((img, i) => {
                         console.log(`    Image ${i} length: ${img.length}`);
                    });
                }
            });
        } else {
            console.log('No data field in response');
        }
    } catch (err) {
        console.error('Error fetching rooms:', err.message);
    }
}

checkBackend();