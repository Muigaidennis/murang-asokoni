// js/auth.js

// 1. REPLACE THESE WITH YOUR ACTUAL KEYS FROM SUPABASE SETTINGS > API
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_KEY = 'your-anon-public-key';

// 2. Initialize the Supabase Client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 3. Function to handle Listing Submissions (for add-listing.html)
async function postListing(event) {
    event.preventDefault();
    
    const title = document.getElementById('item-title').value;
    const category = document.getElementById('category').value;
    const price = document.getElementById('price').value;
    const description = document.getElementById('description').value;
    const location = document.getElementById('location').value; // Make sure your form has this or use a default
    const imageFile = document.getElementById('image-input').files[0];

    let imageUrl = '';

    // Upload image if it exists
    if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name}`;
        const { data, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, imageFile);
        
        if (uploadError) {
            alert('Error uploading image: ' + uploadError.message);
            return;
        }
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
    }

    // Save listing to database
    const { data, error } = await supabase
        .from('listings')
        .insert([
            { title, price, category, description, location: 'Murang\'a', image_url: imageUrl }
        ]);

    if (error) {
        alert('Error saving listing: ' + error.message);
    } else {
        alert('Success! Your item is now live.');
        window.location.href = 'dashboard.html';
    }
}
