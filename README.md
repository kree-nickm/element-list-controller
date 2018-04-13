# Element View Controller
Provides robust options for sorting, filtering, and paginating a set of HTML elements. Designed to work with tables, but also works with any list of elements with corresponding attributes. Requires jQuery.
<<<<<<< HEAD

## Usage
Include the following into your HTML document:
```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script src="https://kree-nickm.github.io/element-view-controller/evc.js"></script>
```
This will include both jQuery and this script.

Your HTML document must also include the following CSS at a minimum:
```css
.filtered .filtered-out {
	display: none;
}

.paged .paged-out {
	display: none;
}
```
Otherwise the filtering and paginating will not work. The JavaScript does not explicitly hide or show the affected elements, but instead adds CSS classes to them and expects the CSS to handle it from there. Of course, you can change the above CSS if you do not want filtered elements to be entirely removed, and likewise for elements not on the current page.

For examples, check out [the demo page](https://kree-nickm.github.io/element-view-controller/index.html) as well as some [basic CSS](https://kree-nickm.github.io/element-view-controller/basic.css) to make the page a little more user-friendly.
=======
>>>>>>> e9e9b7a8bb0dd5d9a25f94f234e006b1e46b24fc
