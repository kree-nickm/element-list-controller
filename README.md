# Element List Controller
Provides robust options for sorting, filtering, and paginating a list of HTML elements. Designed to work with tables, but will eventually work with any list of elements with corresponding attributes or child elements. Requires jQuery for now, but that will change as well. This is written only with modern, updated browsers in mind. I will not be adding any support for browsers that do not follow modern standards anytime soon.

* <a href="#usage">Usage</a>
	* <a href="#sorting">Sorting</a>
		* <a href="#sorting-css">CSS</a>
	* <a href="#filtering">Filtering</a>
		* <a href="#filtering-css">CSS</a>
		* <a href="#filtering-options">Filtering Options</a>
	* <a href="#paginating">Paginating</a>
		* <a href="#paginating-css">CSS</a>
<a name="usage"></a>
## Usage
Include the following into your HTML document:
```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script src="https://kree-nickm.github.io/element-list-controller/elc.js"></script>
```
This will include both jQuery and the development version of this script. To load a specific release (recommended in case future versions alter or remove funtionality), use the URL for that release instead.

For examples, check out [the demo page](https://kree-nickm.github.io/element-list-controller/index.html) as well as some [basic CSS](https://kree-nickm.github.io/element-list-controller/basic.css) to make the page a little more user-friendly.

Elements added to the list dynamically after the page has loaded will be sorted/filtered/paginated automatically, provided the browser supports `MutationObserver`. Otherwise, `ELC_update(list_container)` can be called, where `list_container` is the element with the `sortable`/`filtered`/`paged` class(es).

If you add entirely new list container elements to the page dynamically, there isn't yet a way to add this script's functionality to them.
<a name="sorting"></a>
### Sorting
Add the `sortable` class to the element that contains all of the elements in your list. You should also give this element a unique `id`. In most cases, the elements you wish to sort must be the immediate children of the `sortable` element. The one exception is if a `<table>` is your `sortable` element, in which case the elements that you will be sorting must be `<tr>`s inside of a `<tbody>` inside of the `<table>`. The `<table>` must utilize the `<thead>` and `<tbody>` elements to distingush the header row(s) from the table content to be sorted.
```html
<div id="my_container" class="sortable">
	<!-- All elements to be sorted go here. -->
</div>

<table id="my_table" class="sortable">
	<thead>
	</thead>
	<tbody>
		<!-- <TR> elements to be sorted go here. -->
	</tbody>
</table>
```
The elements in the list will be sorted when you click on another designated element. In most cases, this element can be anything with the `sort` class as well as a `data-field` attribute identifying the field that the element list will be sorted by (more on that below). Additionally, the `sort` element needs to specify which container it will be operating on by including a `data-container` attribute with the `id` of the desired `sortable` element. Alternatively, all of the `sort` elements can be grouped together inside of an element with the `sorter` class, in which case only the `sorter` element needs to specify `data-container`. Lastly, if the `sort` elements are all inside of the `sortable` element somewhere, then it does not need to be specified at all - they will use their ancestor `sortable` element. The latter is generally only the case with `<table>` elements, where the `sort` classes would be added to the desired header cells in the `<thead>` element. Note that `<table>`s also do not need to specify `data-field` for `sort`s in the `<thead>`, as they will automatically sort by the corresponding column of the header that is clicked.
```html
<div class="sorter" data-container="my_container">
	<span class="sort" data-field="first_name">Sort By First Name</span>
	<span class="sort" data-field="last_name">Sort By Last Name</span>
</div>
<button class="sort" data-field="something_else" data-container="my_container">Sort By Something Else</button>
<div id="my_container" class="sortable">
	<!-- All elements to be sorted go here. -->
</div>

<table id="my_table" class="sortable">
	<thead>
		<tr>
			<th class="sort">First Name</th>
			<th class="sort">Last Name</th>
		</tr>
	</thead>
	<tbody>
		<!-- <TR> elements to be sorted go here. -->
	</tbody>
</table>
```
You can also have a `sort` element specify what kind of data it is sorting. Use the `data-type` attribute. Valid values are as follows:
* __text__: (default) The data will be treated as normal text, with any markup tags stripped away. This should sort it alphabetically according to the actual text that is readable by the user.
* __html__: The data will be treated as text, but markup tags will not be stripped away. This will treat all of the inner HTML as text and sort that alphabetically.
* __number__: The data will be treated as numeric and sorted lowest to highest.

By default, the sorting will go in ascending order on the first click, as noted above. You can reverse that by adding the `data-order` attribute to the `sort` element. Setting that attribute to any string that starts with `d` well make that field sort in descending order on the first click.
```html
<button class="sort" data-field="something_else" data-container="my_container" data-type="html">Sort By Something Else</button>
<div id="my_container" class="sortable">
	<!-- All elements to be sorted go here. -->
</div>

<table id="my_table" class="sortable">
	<thead>
		<tr>
			<th class="sort" data-type="text">Name</th>
			<th class="sort" data-type="number" data-order="desc">Age</th>
		</tr>
	</thead>
	<tbody>
		<!-- <TR> elements to be sorted go here. -->
	</tbody>
</table>
```
The `sort` element can be clicked again to reverse the order. The merge-sort algorithm is used, so sorting is stable and should be quite fast even for extremely large lists of elements. You can also add the `sort-initial` class to a `sort` element, and the script will simulate a click event on that `sort` element once the list has initialized. This will set the default list order as well as add the appropriate `sortup`/`sortdown` classes.
```html
<button class="sort sort-initial" data-field="something_else" data-container="my_container" data-type="html">Sort By Something Else</button>
<div id="my_container" class="sortable">
	<!-- All elements to be sorted go here. -->
</div>
```
Finally, to actually fill in the sortable data inside of the element list, you have a couple choices:
* An attribute can be included by an immediate child of the list container in this format: `data-<field>-value="<value>"`, where `<field>` corresponds to the value of `data-field` in the `sort` element, and `<value>` is your data. Note that field names cannot contain hyphens (`-`) with this method, because of the way JavaScript translates them. This may be fixed in a future update.
* A child element somewhere inside of the list element must have a `name` attribute set to the corresponding `data-field` of the desired `sort` element. The data to be sorted is the content inside of this child element. Alternatively, you can also include a `data-value` attribute in this element, and that data will be used to sort instead of the inner content.
* If using a `<table>`, you do not need to do either of the above. Clicking a column header inside `<thead>` will sort by the corresponding column.
```html
<div class="sorter" data-container="my_container">
	<span class="sort" data-field="first_name">Sort By First Name</span>
	<span class="sort" data-field="last_name">Sort By Last Name</span>
</div>
<div id="my_container" class="sortable">
	<div data-first_name-value="John">
		<span name="last_name" data-value="Smith">von Smith</span> <!-- "Smith" will be used to sort this instead of "von Smith" -->
	</div>
	<!-- More elements here following the same format. -->
</div>

<table id="my_table" class="sortable">
	<thead>
		<tr>
			<th class="sort" data-type="text">Name</th>
			<th class="sort" data-type="number">Age</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Inigo Montoya</td>
			<td data-value="30">Thirty</td>
		</tr>
		<!-- More rows here following the same format. -->
	</tbody>
</table>
```
The sorting can be animated by adding the `data-sort-transition-time` attribute to the `sortable` list container. The value of this attribute should be a string specifying the duration, ie. `1s`. You can also include the easing algorithm ie. `1s ease 0s`. See the [transition CSS property](https://www.w3schools.com/cssref/css3_pr_transition.asp) for the possible syntax. This attribute uses the same syntax, but you cannot include a `property` argument. Animation is experimental and may have unintended side effects, as it permanently toys with the position, top, and left CSS properties.
```html
<div id="my_container" class="sortable" data-sort-transition-time="1s">
	<!-- All elements to be sorted go here. -->
</div>

<table id="my_table" class="sortable" data-sort-transition-time=".35s ease-in-out">
	<thead>
	</thead>
	<tbody>
		<!-- <TR> elements to be sorted go here. -->
	</tbody>
</table>
```
<a name="sorting-css"></a>
#### CSS
The `sortdown` class will be added to the sorting header element when it is clicked and active. This will be replaced with the `sortup` class if the header is clicked again the the order is reversed. The following example CSS can be used to add upward and downward arrows to the element when this happens:
```css
.sort.sortup:after {
	content: "\2191";
}
.sort.sortdown:after {
	content: "\2193";
}
```
Additionally, the following CSS may be desirable in order to prevent the sorting header fields from having their text highlighted when rapidly clicked:
```css
.sortable .sort,
.sorter[data-container] .sort,
.sort[data-container] {
	cursor: pointer;
	user-select: none;
	-webkit-user-select: none;
	-moz-user-select: none;
	-khtml-user-select: none;
	-ms-user-select: none;
}
```
<a name="filtering"></a>
### Filtering
Add the `filtered` class to a `<table>` element (referred to as the list container). The `<table>` must utilize the `<thead>` and `<tbody>` elements to distingush the header row(s) from the table content to be filtered.

The only columns in the table that can be filtered upon are the ones that are topped with a header (`<th>` or `<td>`) containing the `filterable` class. Additionally, you can also add the `data-column` attribute to these header cells to give the column a more simple identifier. Otherwise, the identifier will be based on the text content of the header, which could cause problems in certain implementations or if the text is changed later without also changing any column-specific filter inputs.

To filter the list container, use `<input>` elements with the `filter` class. These filter elements can either be inside the list container element, or anywhere else on the page with an additional `data-table` element. That `data-table` element must be a jQuery selector corresponding to the list container to be filtered, ie. `data-table="#demotable"` then the list container has `id="demotable"`.

By default, the filter input will search every field of a list element that corresponds to a header field marked as `filterable`. However, if you wish for a certain filter input to only search a specific field of a list element, then include the `data-column` attribute on the input element. The value of the attribute must either correspond to the `data-column` attribute of a header, or to the text content of a filterable header converted to lowercase. Usage of the `data-column` attribute is recommended.

Finally, a list of currently applied filters can be displayed if an element with the `filter-list` is included inside of the list container. That element's innerHTML will be populated with `<span>` elements representing all applies filters. This is experimental for now and will be improved upon in later releases.

Note that the JavaScript does not explicitly hide the list elements that are filtered out. It instead adds the `filtered-out` class to them. In order to make them hidden, you must use CSS (see below).
<a name="filtering-css"></a>
#### CSS
The `filtered-out` class will be added to any list element that does not match the currently applied filters. Use the following CSS to hide elements from view when they are not on the current page:
```css
.filtered .filtered-out {
	display: none;
}
```
If you are also using the `filter-list` feature, then additional classes will be appended to the child elements of the filter list. `filter-and`, `filter-or`, and `filter-not` classes will be added to any filter terms that are and-separated, or-separated, or negated, respectively.
<a name="filtering-options"></a>
#### Filter Options
For the end-user actually viewing and using the list container, the filter inputs work as follows:
* Spaces separate each term entered into the field, and each term is considered a separate filter.
* All terms are normally "and-separated", meaning *all* of them must be present in a list element, or that element will be filtered out.
* Terms can be prepended with a `|` to make them "or-separated". Only one "or-separated" term must be present in a list element for it to be considered a match.
* Terms can be negated by prepending a `-`. List items will be filtered out if they contain any negated term.
<a name="paginating"></a>
### Paginating
Add the `paged` class to a `<table>` element (referred to as the list container). Anywhere within the `<table>` element, you will also need to add any or all of the following elements with the specified classes:
* Any element with the `pageup` class. When this element is clicked, the list container will display the previous page.
* Any element with the `pagedown` class. When this element is clicked, the list container will display the next page.
* Any element with the `page` class. The innerHTML of this element will be replaced with the current page and total pages, ie. "Page 2 of 5".
* An `<input>` element with the `perpage` class. This should also have the `type` attribute set to `number`. When this number is changed, it will specify the number of list elements displayed on each page of the list container.

The script accounts for any filtered list elements, so both features can be used simultaneously. Note that the JavaScript does not explicitly hide the list elements that are not on the current page. It instead adds the `paged-out` class to them. In order to make them hidden, you must use CSS (see below).
<a name="paginating-css"></a>
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
