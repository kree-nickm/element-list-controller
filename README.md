# Element View Controller
Provides robust options for sorting, filtering, and paginating a set of HTML elements. Designed to work with tables, but will eventually work with any list of elements with corresponding attributes. Requires jQuery.

## Usage
Include the following into your HTML document:
```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script src="https://kree-nickm.github.io/element-view-controller/evc.js"></script>
```
This will include both jQuery and the development version of this script. To load a specific release (recommended in case future versions alter or remove funtionality), use the URL for that release instead.

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

### Sorting
Add the `sortable` class to a `<table>` element. You can add the `sort-animated` class in addition to animate the sorting, though this is experimental and will likely look awkward with paginated or filtered rows. The table must utilize the `<thead>` and `<tbody>` elements to distingush the header from the table content to be sorted.

Within the `<thead>` element, add the `sorter` class to any `<tr>` element that contains the cells (`<th>` or `<td>`) that you wish to use as a sorting column header. This is optional, unless there are multiple `<tr>`s within `<thead>`, and you aren't using the first one.

Within the above-mentioned `<tr>` rows, add the `sort` class to any cells that you want to serve as sorting column headers. When these cells are clicked, the table will be sorted according to the data in that column of the table. They can be clicked again to reverse the order.

By default, the column will be sorted alphabetically by its HTML content. To change this behavior, you can add the `data-type` attribute to the header cell. Valid values for the attribute are `text` (default) to sort alphabetically, `number` to sort numerically, or `link` to sort alphabetically when the column data contains `<a>` tags, and you want to sort by the link text.

#### CSS
The `sortdown` class will be added to the sorting header cell when it is clicked and active. This will be replaced with the `sortup` class if the cell is clicked again the the order is reversed. The following example CSS can be used to add upward and downward arrows to the cell when this happens:
```css
.sortable .sortup:after {
	content: "\2191";
}

.sortable .sortdown:after {
	content: "\2193";
}
```

Additionally, the following CSS may be desirable in order to prevent the sorting header cells from having their text highlighted when double-clicked:
```css
.sortable .sort {
	cursor: pointer;
	user-select: none;
	-webkit-user-select: none;
	-moz-user-select: none;
	-khtml-user-select: none;
	-ms-user-select: none;
}
```

### Filtering
Text.

### Paginating
Text.
