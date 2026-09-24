# Login Redirect Update

- Removed the browser `alert('Please sign in before buying.')` behavior.
- Clicking **Buy Now** while signed out now redirects directly to `/login`.
- Clicking **Add to Cart** while signed out also redirects to `/login` instead of showing a browser alert.
- Clicking **Buy Now** while signed in adds the item to the cart and navigates to `/checkout`.
