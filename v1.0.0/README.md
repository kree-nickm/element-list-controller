# Element List Controller
Provides robust options for sorting, filtering, and paginating a list of HTML elements. Designed to work with tables, but will eventually work with any list of elements with corresponding attributes or child elements. Requires jQuery.

Currently only applies to HTML elements that are present on the page at the time the page initially finishes loading. Cannot be used with elements that are dynamically added to the page via AJAX or anything similar.

## Usage
Include the following into your HTML document:
```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script src="https://kree-nickm.github.io/element-list-controller/v1.0.0/elc.js"></script>
```
This will include both jQuery and this script.

### Sorting
Add the `sortable` class to a `<table>` element (referred to as the list container). You can add the `sort-animated` class in addition to animate the sorting, though this is experimental and will likely look awkward with paginated or filtered list containers. The `<table>` must utilize the `<thead>` and `<tbody>` elements to distingush the header row(s) from the table content to be sorted.

Within the `<thead>` element, add the `sorter` class to any `<tr>` element that contains the fields (`<th>` or `<td>`) that you wish to use as a sorting header. This is optional, unless there are multiple `<tr>`s within `<thead>`, and you aren't using the first one.

Within the above-mentioned `<tr>` elements, add the `sort` class to any fields that you want to serve as sorting headers. When these fields are clicked, the list container will be sorted according to the data in that field of each list element. Sorting headers can be clicked again to reverse the order.

By default, the column will be sorted alphabetically by its HTML content. To change this behavior, you can add the `data-type` attribute to the sorting header. Valid values for the attribute are `text` (default) to sort alphabetically, `number` to sort numerically, or `link` to sort alphabetically when the field data contains `<a>` tags, and you want to sort by the link text.
#### CSS
The `sortdown` class will be added to the sorting header element when it is clicked and active. This will be replaced with the `sortup` class if the header is clicked again the the order is reversed. The following example CSS can be used to add upward and downward arrows to the element when this happens:
```css
.sortable .sortup:after {
	content: "\2191";
}
.sortable .sortdown:after {
	content: "\2193";
}
```
Additionally, the following CSS may be desirable in order to prevent the sorting header fields from having their text highlighted when rapidly clicked:
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
Add the `filtered` class to a `<table>` element (referred to as the list container). The `<table>` must utilize the `<thead>` and `<tbody>` elements to distingush the header row(s) from the table content to be filtered.

The only columns in the table that can be filtered upon are the ones that are topped with a header (`<th>` or `<td>`) containing the `filterable` class. Additionally, you can also add the `data-column` attribute to these header cells to give the column a more simple identifier. Otherwise, the identifier will be based on the text content of the header, which could cause problems in certain implementations or if the text is changed later without also changing any column-specific filter inputs.

To filter the list container, use `<input>` elements with the `filter` class. These filter elements can either be inside the list container element, or anywhere else on the page with an additional `data-table` element. That `data-table` element must be a jQuery selector corresponding to the list container to be filtered, ie. `data-table="#demotable"` then the list container has `id="demotable"`.

By default, the filter input will search every field of a list element that corresponds to a header field marked as `filterable`. However, if you wish for a certain filter input to only search a specific field of a list element, then include the `data-column` attribute on the input element. The value of the attribute must either correspond to the `data-column` attribute of a header, or to the text content of a filterable header converted to lowercase. Usage of the `data-column` attribute is recommended.

Finally, a list of currently applied filters can be displayed if an element with the `filter-list` is included inside of the list container. That element's innerHTML will be populated with `<span>` elements representing all applies filters. This is experimental for now and will be improved upon in later releases.

Note that the JavaScript does not explicitly hide the list elements that are filtered out. It instead adds the `filtered-out` class to them. In order to make them hidden, you must use CSS (see below).
#### CSS
The `filtered-out` class will be added to any list element that does not match the currently applied filters. Use the following CSS to hide elements from view when they are not on the current page:
```css
.filtered .filtered-out {
	display: none;
}
```
If you are also using the `filter-list` feature, then additional classes will be appended to the child elements of the filter list. `filter-and`, `filter-or`, and `filter-not` classes will be added to any filter terms that are and-separated, or-separated, or negated, respectively.
#### Filter Options
For the end-user actually viewing and using the list container, the filter inputs work as follows:
* Spaces separate each term entered into the field, and each term is considered a separate filter.
* All terms are normally "and-separated", meaning *all* of them must be present in a list element, or that element will be filtered out.
* Terms can be prepended with a `|` to make them "or-separated". Only one "or-separated" term must be present in a list element for it to be considered a match.
* Terms can be negated by prepending a `-`. List items will be filtered out if they contain any negated term.

### Paginating
Add the `paged` class to a `<table>` element (referred to as the list container). Anywhere within the `<table>` element, you will also need to add any or all of the following elements with the specified classes:
* Any element with the `pageup` class. When this element is clicked, the list container will display the previous page.
* Any element with the `pagedown` class. When this element is clicked, the list container will display the next page.
* Any element with the `page` class. The innerHTML of this element will be replaced with the current page and total pages, ie. "Page 2 of 5".
* An `<input>` element with the `perpage` class. This should also have the `type` attribute set to `number`. When this number is changed, it will specify the number of list elements displayed on each page of the list container.

The script accounts for any filtered list elements, so both features can be used simultaneously. Note that the JavaScript does not explicitly hide the list elements that are not on the current page. It instead adds the `paged-out` class to them. In order to make them hidden, you must use CSS (see below).
#### CSS
The `paged-out` class will be added to any list element that is not on the current page of the list container. Use the following CSS to hide elements from view when they are not on the current page:
```css
.paged .paged-out {
	display: none;
}
```
Additionally, the following CSS may be desirable in order to prevent the designated "next page" and "previous page" elements from having their text highlighted when rapidly clicked:
```css
.paged .pageup,
.paged .pagedown {
	cursor: pointer;
	user-select: none;
	-webkit-user-select: none;
	-moz-user-select: none;
	-khtml-user-select: none;
	-ms-user-select: none;
}
```
Finally, the `active` class will be present on the designated "next page" and "previous page" elements while there actually is a next or previous page, respectively. The following CSS can be used to dim those elements when the first or last page is currently visible:
```css
.paged .pageup,
.paged .pagedown {
	opacity: 0.5;
}

.paged .pageup.active,
.paged .pagedown.active {
	opacity: 1;
}
```
