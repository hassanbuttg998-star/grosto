/* =========================================================
   GROSTO - Master Category List
   Naya category add karna ho to sirf yahan add karein -
   Shop page, Categories page aur Admin panel sab yahan se
   uthate hain.

   value  -> products.category column mein yehi exact text hona chahiye
   label  -> user ko jo dikhta hai
   icon   -> emoji (fallback jab tak real photo na lagi ho)
   ========================================================= */

window.GROSTO_CATEGORIES = [
  { value: "Fruits & Vegetables", label: "Fruits & Vegetables", icon: "\u{1F96C}" },
  { value: "Grocery", label: "Grocery & Rashan", icon: "\u{1F6D2}" },
  { value: "Dairy", label: "Dairy & Eggs", icon: "\u{1F95B}" },
  { value: "Bakery", label: "Bakery", icon: "\u{1F35E}" },
  { value: "Local", label: "Local Products", icon: "\u{1F3EA}" },
  { value: "Mobile Accessories", label: "Mobile Accessories", icon: "\u{1F4F1}" },
  { value: "Drinks", label: "Drinks & Beverages", icon: "\u{1F964}" },
  { value: "Tea & Coffee", label: "Tea & Coffee", icon: "\u2615" },
  { value: "Snacks", label: "Biscuits & Snacks", icon: "\u{1F36A}" },
  { value: "Spices & Masala", label: "Spices & Masala", icon: "\u{1F336}\uFE0F" },
  { value: "Personal Care", label: "Personal Care & Beauty", icon: "\u{1F9F4}" },
  { value: "Baby Care", label: "Baby Care", icon: "\u{1F37C}" },
  { value: "Electrical", label: "Electrical & Electronics", icon: "\u{1F50C}" },
  { value: "Household", label: "Household & Cleaning", icon: "\u{1F9F9}" },
  { value: "Stationery", label: "Stationery & Others", icon: "\u{1F4DA}" },
  { value: "Pet Care", label: "Pet Care", icon: "\u{1F43E}" }
];


/* ================= REAL CATEGORY PHOTOS (admin-uploaded) =================
   Categories khud static list hain (upar), lekin unki photo Admin Panel se
   Supabase mein "category_images" table mein save hoti hai. Ye function
   ek dafa fetch karke {value: image_url} map return karta hai.
*/

let _categoryImagesCache = null;

window.loadCategoryImages = function () {

  if (_categoryImagesCache) return Promise.resolve(_categoryImagesCache);

  return grostoDB
    .from("category_images")
    .select("category_value, image")
    .then(function (res) {

      const map = {};

      (res.data || []).forEach(function (row) {
        if (row.image) map[row.category_value] = row.image;
      });

      _categoryImagesCache = map;

      return map;
    })
    .catch(function () {
      return {};
    });
};


/* ================= SHARED TILE HTML (photo if set, warna emoji) ================= */

window.categoryIconHtml = function (cat, imageMap) {

  const url = imageMap && imageMap[cat.value];

  if (url) {
    return '<img src="' + url.replace(/"/g, "%22") + '" alt="" loading="lazy">';
  }

  return cat.icon;
};
