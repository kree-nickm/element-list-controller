var ELC_debug_mode = false;
Element.prototype.getFirstElementByName = function(name)
{
	for(var i = 0; i < this.children.length; i++)
		if(this.children[i].getAttribute('name') == name)
			return this.children[i];
	for(var i = 0; i < this.children.length; i++)
	{
		var result = this.children[i].getFirstElementByName(name);
		if(result != null)
			return result;
	}
	return null;
}

var ELC_hooks = { // TODO: make this an object property
	before_update:[],
	after_update:[]
};
function ELC_addHook(type, callback, params)
{
	if(ELC_hooks[type] != null)
		ELC_hooks[type].push({callback:callback,params:params});
	else
		console.log("Invalid ELC hook: "+ type);
}

function ELC_update(list_container, type)
{
	var list = (list_container.tagName=="TABLE" ? list_container.tBodies[0] : list_container);
	list.ELC_MutationObserver.disconnect();
	for(var i in ELC_hooks.before_update)
		ELC_hooks.before_update[i].callback.apply(list_container, ELC_hooks.before_update[i].params);
	if(type != "page" && type != "filter")
		ELC_sort_list(list_container);
	if(type != "page" && type != "sort")
		ELC_apply_filter(list_container);
	ELC_display_page(list_container);
	for(var i in ELC_hooks.after_update)
		ELC_hooks.after_update[i].callback.apply(list_container, ELC_hooks.after_update[i].params);
	list.ELC_MutationObserver.observe(list, {childList:true});
}

function ELC_element_added(mutationList)
{
	var updated = [];
	for(var i in mutationList)
	{
		if(!updated.includes(mutationList[i].target) && mutationList[i].type == "childList")
		{
			updated.push(mutationList[i].target);
			if(mutationList[i].target.tagName == "TBODY")
				ELC_update(mutationList[i].target.parentNode, "change");
			else
				ELC_update(mutationList[i].target, "change");
		}
	}
}

function ELC_get_list_container(current, containerClass, myClasses)
{
	do {
		if(current.classList.contains(containerClass))
			return current;
		else if(current.dataset.container != null)
		{
			for(var i in myClasses)
			{
				if(current.classList.contains(myClasses[i]))
					var result = document.getElementById(current.dataset.container);
				if(result != null && result.classList.contains(containerClass))
					return result;
			}
		}
		current = current.parentElement;
	} while(current != null);
	return null;
}

// ---- Begin sorting functions ----
function ELC_sort_event_listener(event)
{
	if(this.ELC_list_container == null)
	{
		console.log("Cannot find the table this sorter is meant to apply to: "+ $(this));
		return;
	}
	for(var i in this.ELC_list_container.ELC_list_sorters)
	{
		this.ELC_list_container.ELC_list_sorters[i].classList.remove("sortup");
		this.ELC_list_container.ELC_list_sorters[i].classList.remove("sortdown");
		if(this.ELC_list_container.ELC_list_sorters[i].ELC_field == this.ELC_field)
		{
			if(this.ELC_list_container.ELC_current_sort_field == this.ELC_field && this.ELC_list_container.ELC_current_sort_reversed == false)
				this.ELC_list_container.ELC_list_sorters[i].classList.add("sortup");
			else
				this.ELC_list_container.ELC_list_sorters[i].classList.add("sortdown");
		}
	}
	this.ELC_list_container.ELC_current_sort_type = this.ELC_sort_type;
	if(this.ELC_list_container.ELC_current_sort_field == this.ELC_field)
	{
		this.ELC_list_container.ELC_current_sort_reversed = !this.ELC_list_container.ELC_current_sort_reversed;
	}
	else
	{
		this.ELC_list_container.ELC_current_sort_field = this.ELC_field;
		this.ELC_list_container.ELC_current_sort_reversed = (this.dataset.order != null && this.dataset.order.toLowerCase()[0] == "d");
	}
	if(e.detail != "noupdate")
		ELC_update(this.ELC_list_container, "sort");
}

function ELC_sort_list(list_container)
{
	if(list_container.ELC_current_sort_field == null)
		return;
	var list = (list_container.tagName=="TABLE" ? list_container.tBodies[0] : list_container);
	for(var i = 0; i < list.children.length; i++)
	{
		if(list.children[i].tagName == "TR")
		{
			if(list_container.ELC_current_sort_type == "number")
				list.children[i].ELC_current_sort_value = parseFloat(list.children[i].children[list_container.ELC_current_sort_field].innerText);
			else if(list_container.ELC_current_sort_type == "html")
				list.children[i].ELC_current_sort_value = list.children[i].children[list_container.ELC_current_sort_field].innerHTML;
			else
				list.children[i].ELC_current_sort_value = list.children[i].children[list_container.ELC_current_sort_field].innerText;
		}
		else
		{
			if(list.children[i].dataset[list_container.ELC_current_sort_field+"Value"] != null)
				var string = list.children[i].dataset[list_container.ELC_current_sort_field+"Value"];
			else
			{
				var element = list.children[i].getFirstElementByName(list_container.ELC_current_sort_field);
				if(element != null)
					var string = (element.dataset.value!=null ? element.dataset.value : (list_container.ELC_current_sort_type=="html" ? element.innerHTML : element.innerText));
				else
					var string = "";
			}
			if(list_container.ELC_current_sort_type == "number")
				list.children[i].ELC_current_sort_value = parseFloat(string);
			else
				list.children[i].ELC_current_sort_value = string;
		}
		if(list_container.dataset.sortTransitionTime)
		{
			list.children[i].ELC_prevTop = list.children[i].offsetTop;
			list.children[i].ELC_prevLeft = list.children[i].offsetLeft;
		}
	}
	ELC_merge_sort(list.children, list_container, list);
	if(list_container.dataset.sortTransitionTime)
	{
		for(var i = 0; i < list.children.length; i++)
		{
			var element = list.children[i];
			if(window.getComputedStyle(element, null).getPropertyValue("position") == "static")
				element.style.position = "relative";
			if(element.tagName == "TR")
			{
				// Why do TRs have to be so annoying.
				for(var k = 0; k < element.children.length; k++)
				{
					var subelement = element.children[k];
					if(window.getComputedStyle(subelement, null).getPropertyValue("position") == "static")
						subelement.style.position = "relative";
					subelement.style.transition = "all 0s";
					subelement.style.top = (element.ELC_prevTop - element.offsetTop) +"px";
					subelement.style.left = (element.ELC_prevLeft - element.offsetLeft) +"px";
					setTimeout(function(element, subelement){
						subelement.style.transition = "all "+ list_container.dataset.sortTransitionTime;
						setTimeout(function(element, subelement){
							// Not compatible with any top/left that may already be set.
							subelement.style.top = "0px";
							subelement.style.left = "0px";
						}, 1, element, subelement);
					}, 1, element, subelement);
				}
			}
			else
			{
				element.style.transition = "all 0s";
				element.style.top = (element.ELC_prevTop - element.offsetTop) +"px";
				element.style.left = (element.ELC_prevLeft - element.offsetLeft) +"px";
				setTimeout(function(element){
					element.style.transition = "all "+ list_container.dataset.sortTransitionTime;
					setTimeout(function(element){
						// Not compatible with any top/left that may already be set.
						element.style.top = "0px";
						element.style.left = "0px";
					}, 1, element);
				}, 1, element);
			}
		}
	}
}

function ELC_merge_sort(list, container, target)
{
	var one = Array.prototype.slice.call(list, 0, Math.floor(list.length/2));
	var two = Array.prototype.slice.call(list, Math.floor(list.length/2));
	if(one.length > 1)
		ELC_merge_sort(one, container);
	if(two.length > 1)
		ELC_merge_sort(two, container);
	for(var i = 0; i < list.length; i++)
	{
		if(!one.length || two.length && ELC_compare(two[0], one[0], container) > 0)
		{
			if(target != null && target.children.length == list.length)
				target.appendChild(two.shift());
			else
				list[i] = two.shift();
		}
		else
		{
			if(target != null && target.children.length == list.length)
				target.appendChild(one.shift());
			else
				list[i] = one.shift();
		}
	}
}

function ELC_compare(a, b, container)
{
	if(container.ELC_current_sort_type == "number")
		return (container.ELC_current_sort_reversed?-1:1) * (b.ELC_current_sort_value - a.ELC_current_sort_value);
	else
		return (container.ELC_current_sort_reversed?-1:1) * b.ELC_current_sort_value.localeCompare(a.ELC_current_sort_value);
}
// ---- End sorting functions ----

// ---- Begin filtering functions ----
function ELC_apply_filter(list_container)
{
	if(list_container.ELC_active_filters == null)
		return;
	var list = (list_container.tagName=="TABLE" ? list_container.tBodies[0] : list_container);
	for(var i = 0; i < list.children.length; i++)
	{
		list.children[i].classList.remove("filtered-out");
		for(var k in list_container.ELC_active_filters.and) // & list_container.ELC_active_filters.or & list_container.ELC_active_filters.not - they should all have the same keys
		{
			// k is either "" for a filter that applies to all text in the element, or the identifier of the data to be matched against
			if(k)
			{
				if(list.children[i].tagName == "TR")
				{
					//if(list_container.ELC_current_sort_type == "number")
					//	var text = parseFloat(list.children[i].children[filter_columns[k]].innerText);
					//else if(list_container.ELC_current_sort_type == "html")
					//	var text = list.children[i].children[filter_columns[k]].innerHTML;
					//else
						var text = list.children[i].children[filter_columns[k]].innerText;
				}
				else
				{
					if(list.children[i].dataset[k+"Value"] != null)
						var string = list.children[i].dataset[k+"Value"];
					else
					{
						var element = list.children[i].getFirstElementByName(k);
						if(element != null)
							//var string = (element.dataset.value!=null ? element.dataset.value : (list_container.ELC_current_sort_type=="html" ? element.innerHTML : element.innerText));
							var string = element.innerText;
						else
							var string = "";
					}
					//if(list_container.ELC_current_sort_type == "number")
					//	var text = parseFloat(string);
					//else
						var text = string;
				}
			}
			else
				var text = list.children[i].textContent;
			text = text.toLowerCase();
			
			var and_clause = true;
			if(list_container.ELC_active_filters.and[k] && list_container.ELC_active_filters.and[k].length > 0)
			{
				for(var j in list_container.ELC_active_filters.and[k])
				{
					try // There should be no blank strings in the array, but just in case...
					{
						if(text.indexOf(list_container.ELC_active_filters.and[k][j].toLowerCase()) == -1)
						{
							and_clause = false;
							break;
						}
					}
					catch(err)
					{
						console.log(err);
					}
				}
			}
			
			var or_clause = true;
			if(list_container.ELC_active_filters.or[k] && list_container.ELC_active_filters.or[k].length > 0)
			{
				or_clause = false;
				for(var j in list_container.ELC_active_filters.or[k])
				{
					try // There should be no blank strings in the array, but just in case...
					{
						if(text.indexOf(list_container.ELC_active_filters.or[k][j].toLowerCase()) != -1)
						{
							or_clause = true;
							break;
						}
					}
					catch(err)
					{
						console.log(err);
					}
				}
			}
			
			var not_clause = true;
			if(list_container.ELC_active_filters.not[k] && list_container.ELC_active_filters.not[k].length > 0)
			{
				for(var j in list_container.ELC_active_filters.not[k])
				{
					try // There should be no blank strings in the array, but just in case...
					{
						if(text.indexOf(list_container.ELC_active_filters.not[k][j].toLowerCase()) != -1)
						{
							not_clause = false;
							break;
						}
					}
					catch(err)
					{
						console.log(err);
					}
				}
			}
			
			if(ELC_debug_mode) console.log({element:list.children[i], field:k, textToSearch:text, andFilters:list_container.ELC_active_filters.and[k], orFilters:list_container.ELC_active_filters.or[k], notFilters:list_container.ELC_active_filters.not[k], andResult:and_clause, orResult:or_clause, notResult:not_clause});
			
			if(!and_clause || !or_clause || !not_clause)
			{
				list.children[i].classList.add("filtered-out");
				break;
			}
		}
	}
}

var filter_delay = setTimeout(function(){}, 1); // TODO: make this an object property
function ELC_filter_change_listener(e)
{
	clearTimeout(filter_delay);
	if(this.ELC_list_container == null)
	{
		console.log("Cannot find the table this filter is meant to apply to: "+ $(this));
		return;
	}
	if(e != null && e.type == "keyup") // Give user some "time" to finish typing.
		filter_delay = setTimeout(function(c,e){ELC_filter_change_listener_step2.call(c,e);}, 250, this, e);
	else
		ELC_filter_change_listener_step2.call(this, e);
}

function ELC_filter_change_listener_step2(e)
{
	// TODO: save the current filters instead of rebuild from scratch if they haven't changed
	this.ELC_list_container.ELC_active_filters = {
		and: {},
		or: {},
		not: {}
	};
	for(var i = 0; i < this.ELC_list_container.ELC_list_filters.length; i++)
	{
		if(!this.ELC_list_container.ELC_active_filters.and[this.ELC_list_container.ELC_list_filters[i].ELC_field])
			this.ELC_list_container.ELC_active_filters.and[this.ELC_list_container.ELC_list_filters[i].ELC_field] = [];
		if(!this.ELC_list_container.ELC_active_filters.or[this.ELC_list_container.ELC_list_filters[i].ELC_field])
			this.ELC_list_container.ELC_active_filters.or[this.ELC_list_container.ELC_list_filters[i].ELC_field] = [];
		if(!this.ELC_list_container.ELC_active_filters.not[this.ELC_list_container.ELC_list_filters[i].ELC_field])
			this.ELC_list_container.ELC_active_filters.not[this.ELC_list_container.ELC_list_filters[i].ELC_field] = [];
		switch(this.ELC_list_container.ELC_list_filters[i].type)
		{
			case "checkbox":
				if(this.ELC_list_container.ELC_list_filters[i].checked && this.ELC_list_container.ELC_list_filters[i].value.length > 0)
					this.ELC_list_container.ELC_active_filters.or[this.ELC_list_container.ELC_list_filters[i].ELC_field].push(this.ELC_list_container.ELC_list_filters[i].value);
				break;
			case "radio":
				if(this.ELC_list_container.ELC_list_filters[i].checked && this.ELC_list_container.ELC_list_filters[i].value.length > 0)
					this.ELC_list_container.ELC_active_filters.and[this.ELC_list_container.ELC_list_filters[i].ELC_field].push(this.ELC_list_container.ELC_list_filters[i].value);
				break;
			case "number":
			case "select-one":
				if(this.ELC_list_container.ELC_list_filters[i].value.length > 0)
					this.ELC_list_container.ELC_active_filters.and[this.ELC_list_container.ELC_list_filters[i].ELC_field].push(this.ELC_list_container.ELC_list_filters[i].value);
				break;
			case "select-multiple":
				for(var k = 0; k < this.ELC_list_container.ELC_list_filters[i].selectedOptions.length; k++)
					if(this.ELC_list_container.ELC_list_filters[i].selectedOptions[k].value.length > 0)
						this.ELC_list_container.ELC_active_filters.or[this.ELC_list_container.ELC_list_filters[i].ELC_field].push(this.ELC_list_container.ELC_list_filters[i].selectedOptions[k].value);
				break;
			case "text":
				var string = this.ELC_list_container.ELC_list_filters[i].value;
				if(string)
				{
					var strings = string.split(" ");
					for(var s in strings)
					{
						if(strings[s][0] == "+" && strings[s].length > 1)
						{
							this.ELC_list_container.ELC_active_filters.and[this.ELC_list_container.ELC_list_filters[i].ELC_field].push(strings[s].substr(1));
						}
						else if(strings[s][0] == "|" && strings[s].length > 1)
						{
							this.ELC_list_container.ELC_active_filters.or[this.ELC_list_container.ELC_list_filters[i].ELC_field].push(strings[s].substr(1));
						}
						else if(strings[s][0] == "-" && strings[s].length > 1)
						{
							this.ELC_list_container.ELC_active_filters.not[this.ELC_list_container.ELC_list_filters[i].ELC_field].push(strings[s].substr(1));
						}
						else if(strings[s].length > 0)
						{
							this.ELC_list_container.ELC_active_filters.and[this.ELC_list_container.ELC_list_filters[i].ELC_field].push(strings[s]);
						}
					}
				}
				break;
			default:
				console.log("No filter processing available for element of type: "+ this.ELC_list_container.ELC_list_filters[i].type);
		}
	}
	// TODO: save the created elements and don't recreate them if they haven't changed
	if(this.ELC_list_container.ELC_filter_list != null)
	{
		this.ELC_list_container.ELC_filter_list.innerHTML = "";
		for(var i in this.ELC_list_container.ELC_active_filters.and)
			if(this.ELC_list_container.ELC_active_filters.and[i].length > 0)
				for(var k in this.ELC_list_container.ELC_active_filters.and[i])
					ELC_create_filter_list_element("and", this.ELC_list_container, i, this.ELC_list_container.ELC_active_filters.and[i][k]);
		for(var i in this.ELC_list_container.ELC_active_filters.or)
			if(this.ELC_list_container.ELC_active_filters.or[i].length > 0)
				for(var k in this.ELC_list_container.ELC_active_filters.or[i])
					ELC_create_filter_list_element("or", this.ELC_list_container, i, this.ELC_list_container.ELC_active_filters.or[i][k]);
		for(var i in this.ELC_list_container.ELC_active_filters.not)
			if(this.ELC_list_container.ELC_active_filters.not[i].length > 0)
				for(var k in this.ELC_list_container.ELC_active_filters.not[i])
					ELC_create_filter_list_element("not", this.ELC_list_container, i, this.ELC_list_container.ELC_active_filters.not[i][k]);
	}
	if(e.detail != "noupdate")
		ELC_update(this.ELC_list_container, "filter");
}

function ELC_create_filter_list_element(filter_type, list_container, field, value)
{
	var span = document.createElement("span");
	span.classList.add("filter-"+ filter_type);
	span.ELC_list_container = list_container;
	span.ELC_type = filter_type;
	span.ELC_field = field;
	span.ELC_value = value;
	span.appendChild(document.createTextNode((field ? field+":" : "") + value));
	span.addEventListener("click", remove_filter);
	list_container.ELC_filter_list.appendChild(span);
}

function remove_filter(e)
{
	console.log(e);
}
// ---- End filtering functions ----

// ---- Begin paginating functions ----
function ELC_display_page(list_container)
{
	if(list_container.ELC_current_page == null)
		return;
	var list = (list_container.tagName=="TABLE" ? list_container.tBodies[0] : list_container);
	var rows = [];
	for(var i = 0; i < list.children.length; i++)
	{
		list.children[i].classList.remove("paged-out");
		list.children[i].classList.remove("elceven");
		list.children[i].classList.remove("elcodd");
		if(!list.children[i].classList.contains("filtered-out")) // TODO: make this optional in case user doesn't want filtered things removed completely
			rows.push(list.children[i]);
	}
	if(list_container.ELC_current_page <= 0)
	{
		// TODO: Fix bug: If you are on page 2+ when the perpage is changed to make the page count == 1, "pageup" button doesn't dim out until method is called again
		for(var i in list_container.ELC_pageup_buttons)
			list_container.ELC_pageup_buttons[i].classList.remove("active");
		list_container.ELC_current_page = 0;
	}
	else
		for(var i in list_container.ELC_pageup_buttons)
			list_container.ELC_pageup_buttons[i].classList.add("active");
	
	if(list_container.ELC_current_page + 1 >= rows.length / list_container.ELC_perpage)
	{
		for(var i in list_container.ELC_pagedown_buttons)
			list_container.ELC_pagedown_buttons[i].classList.remove("active");
		list_container.ELC_current_page = Math.ceil(rows.length/list_container.ELC_perpage) - 1;
	}
	else
		for(var i in list_container.ELC_pagedown_buttons)
			list_container.ELC_pagedown_buttons[i].classList.add("active");
	
	var alt = false;
	for(var i in rows)
	{
		if(i < list_container.ELC_current_page*list_container.ELC_perpage || i >= (list_container.ELC_current_page+1)*list_container.ELC_perpage)
			rows[i].classList.add("paged-out");
		else
		{
			rows[i].classList.add(alt ? "elceven" : "elcodd");
			alt = !alt;
		}
	}
	for(var i in list_container.ELC_currentpage_indicators)
		list_container.ELC_currentpage_indicators[i].innerHTML = (list_container.ELC_current_page+1);
	for(var i in list_container.ELC_maxpage_indicators)
		list_container.ELC_maxpage_indicators[i].innerHTML = Math.ceil(rows.length/list_container.ELC_perpage);
}
// ---- End paginating functions ----

var filter_columns = {}; // TODO: make this an object property
function ELC_initialize(event)
{
	var all_containers = [];
	// --- Begin sorting setup
	var sortables = document.getElementsByClassName("sortable");
	for(var i = 0; i < sortables.length; i++)
	{
		if(sortables[i].ELC_list_sorters == null)
			sortables[i].ELC_list_sorters = [];
		for(var k in sortables[i].ELC_list_sorters)
		{
			// TODO: Fix this: ELC_get_list_container gets run twice on any valid element here. Once here and once when iterating through document.getElementsByClassName("sort").
			sortables[i].ELC_list_sorters[k].ELC_list_container = ELC_get_list_container(sortables[i].ELC_list_sorters[k], "sortable", ["sort", "sorter"]);
			if(sortables[i].ELC_list_sorters[k].ELC_list_container != sortables[i])
			{
				sortables[i].ELC_list_sorters[k].removeEventListener("click", ELC_sort_event_listener);
				delete sortables[i].ELC_list_sorters[k];
			}
		}
		if(!all_containers.includes(sortables[i]))
			all_containers.push(sortables[i]);
	}
	
	var sorts = document.getElementsByClassName("sort");
	for(var i = 0; i < sorts.length; i++)
	{
		sorts[i].ELC_list_container = ELC_get_list_container(sorts[i], "sortable", ["sort", "sorter"]);
		if(sorts[i].ELC_list_container != null)
		{
			if(sorts[i].ELC_list_container.tagName == "TABLE")
			{
				if(sorts[i].cellIndex > -1 && sorts[i].ELC_field == null)
				{
					var offset = 0;
					for(var k = 0; k < sorts[i].parentElement.children.length; k++)
					{
						if(sorts[i].parentElement.children[k].cellIndex > -1)
						{
							sorts[i].parentElement.children[k].ELC_field = sorts[i].parentElement.children[k].cellIndex + offset;
							offset += sorts[i].parentElement.children[k].colSpan - 1;
						}
					}
				}
			}
			else if(sorts[i].dataset.field != null)
				sorts[i].ELC_field = sorts[i].dataset.field;
			else
				sorts[i].ELC_field = (sorts[i].innerText!=null ? sorts[i].innerText : sorts[i].textContent);
			
			if(sorts[i].dataset.type == "number" || sorts[i].dataset.type == "html" || sorts[i].dataset.type == "text")
				sorts[i].ELC_sort_type = sorts[i].dataset.type;
			else
				sorts[i].ELC_sort_type = "text";
			
			if(!sorts[i].ELC_list_container.ELC_list_sorters.includes(sorts[i]))
			{
				sorts[i].ELC_list_container.ELC_list_sorters.push(sorts[i]);
				sorts[i].addEventListener("click", ELC_sort_event_listener);
			}
		}
	}
	
	var initial_sorts = document.getElementsByClassName("sort-initial");
	for(var i = 0; i < initial_sorts.length; i++)
	{
		if(initial_sorts[i].ELC_list_container != null)
		{
			initial_sorts[i].dispatchEvent(new CustomEvent("click", {detail:"noupdate"}));
			initial_sorts[i].classList.remove("sort-initial");
			// Above line prevents the sort order from being reinitialized to this field if the sortables are reinitialized. Whether we want that, or to let the list stay sorted as it was, who knows?
		}
	}
	// --- End sorting setup
	
	// --- Begin filtering setup
	var filterables = document.getElementsByClassName("filtered");
	for(var i = 0; i < filterables.length; i++)
	{
		if(filterables[i].ELC_list_filters == null)
			filterables[i].ELC_list_filters = [];
		for(var k in filterables[i].ELC_list_filters)
		{
			// TODO: Fix this: ELC_get_list_container gets run twice on any valid element here. Once here and once when iterating through document.getElementsByClassName("filter").
			filterables[i].ELC_list_filters[k].ELC_list_container = ELC_get_list_container(filterables[i].ELC_list_filters[k], "filtered", ["filter", "filter-group"]);
			if(filterables[i].ELC_list_filters[k].ELC_list_container != filterables[i])
			{
				filterables[i].ELC_list_filters[k].removeEventListener("keyup", ELC_filter_change_listener);
				filterables[i].ELC_list_filters[k].removeEventListener("change", ELC_filter_change_listener);
				delete filterables[i].ELC_list_filters[k];
			}
		}
		if(filterables[i].tagName == "TABLE")
		{
			var filter_fields = filterables[i].getElementsByClassName("filterable");
			for(var k = 0; k < filter_fields.length; k++)
			{
				// May need to fix .cellIndex here like we did in the sorting code
				if(filter_fields[k].dataset.field != null)
					filter_columns[filter_fields[k].dataset.field.toLowerCase()] = filter_fields[k].cellIndex;
				else
					filter_columns[filter_fields[k].innerText.toLowerCase()] = filter_fields[k].cellIndex;
			}
		}
		if(!all_containers.includes(filterables[i]))
			all_containers.push(filterables[i]);
	}
	
	var filter_lists = document.getElementsByClassName("filter-list");
	for(var i = 0; i < filter_lists.length; i++)
	{
		filter_lists[i].ELC_list_container = ELC_get_list_container(filter_lists[i], "filtered", ["filter-list", "filter-group"]);
		if(filter_lists[i].ELC_list_container != null)
			if(filter_lists[i].ELC_list_container.ELC_filter_list != filter_lists[i])
				filter_lists[i].ELC_list_container.ELC_filter_list = filter_lists[i];
	}
	
	var filters = document.getElementsByClassName("filter");
	for(var i = 0; i < filters.length; i++)
	{
		filters[i].ELC_list_container = ELC_get_list_container(filters[i], "filtered", ["filter", "filter-group"]);
		if(filters[i].ELC_list_container != null)
		{
			if(filters[i].dataset.field != null)
				filters[i].ELC_field = filters[i].dataset.field;
			else
				filters[i].ELC_field = "";
			
			if(!filters[i].ELC_list_container.ELC_list_filters.includes(filters[i]))
			{
				filters[i].ELC_list_container.ELC_list_filters.push(filters[i]);
				filters[i].addEventListener("keyup", ELC_filter_change_listener);
				filters[i].addEventListener("change", ELC_filter_change_listener);
				if(filters[i].value != "")
					filters[i].dispatchEvent(new CustomEvent("change", {detail:"noupdate"}));
			}
		}
	}
	// --- End filtering setup
	
	// --- Begin paginating setup
	var pages = document.getElementsByClassName("paged");
	for(var i = 0; i < pages.length; i++)
	{
		if(pages[i].ELC_current_page == null)
			pages[i].ELC_current_page = 0;
		if(pages[i].ELC_pageup_buttons == null)
			pages[i].ELC_pageup_buttons = [];
		if(pages[i].ELC_pagedown_buttons == null)
			pages[i].ELC_pagedown_buttons = [];
		if(pages[i].ELC_currentpage_indicators == null)
			pages[i].ELC_currentpage_indicators = [];
		if(pages[i].ELC_maxpage_indicators == null)
			pages[i].ELC_maxpage_indicators = [];
		if(!all_containers.includes(pages[i]))
			all_containers.push(pages[i]);
	}
	
	var currentpages = document.getElementsByClassName("page-current");
	for(var i = 0; i < currentpages.length; i++)
	{
		currentpages[i].ELC_list_container = ELC_get_list_container(currentpages[i], "paged", ["page-current", "page-group"]);
		if(currentpages[i].ELC_list_container != null)
		{
			if(!currentpages[i].ELC_list_container.ELC_currentpage_indicators.includes(currentpages[i]))
			{
				currentpages[i].ELC_list_container.ELC_currentpage_indicators.push(currentpages[i]);
			}
		}
	}
	
	var maxpages = document.getElementsByClassName("page-max");
	for(var i = 0; i < maxpages.length; i++)
	{
		maxpages[i].ELC_list_container = ELC_get_list_container(maxpages[i], "paged", ["page-max", "page-group"]);
		if(maxpages[i].ELC_list_container != null)
		{
			if(!maxpages[i].ELC_list_container.ELC_maxpage_indicators.includes(maxpages[i]))
			{
				maxpages[i].ELC_list_container.ELC_maxpage_indicators.push(maxpages[i]);
			}
		}
	}
	
	var pageups = document.getElementsByClassName("pageup");
	for(var i = 0; i < pageups.length; i++)
	{
		pageups[i].ELC_list_container = ELC_get_list_container(pageups[i], "paged", ["pageup", "page-group"]);
		if(pageups[i].ELC_list_container != null)
		{
			if(!pageups[i].ELC_list_container.ELC_pageup_buttons.includes(pageups[i]))
			{
				pageups[i].ELC_list_container.ELC_pageup_buttons.push(pageups[i]);
				pageups[i].addEventListener("click", function(e){
					this.ELC_list_container.ELC_current_page = this.ELC_list_container.ELC_current_page-1;
					ELC_update(this.ELC_list_container, "page");
				});
			}
		}
	}
	
	var pagedowns = document.getElementsByClassName("pagedown");
	for(var i = 0; i < pagedowns.length; i++)
	{
		pagedowns[i].ELC_list_container = ELC_get_list_container(pagedowns[i], "paged", ["pagedown", "page-group"]);
		if(pagedowns[i].ELC_list_container != null)
		{
			if(!pagedowns[i].ELC_list_container.ELC_pagedown_buttons.includes(pagedowns[i]))
			{
				pagedowns[i].ELC_list_container.ELC_pagedown_buttons.push(pagedowns[i]);
				pagedowns[i].addEventListener("click", function(e){
					this.ELC_list_container.ELC_current_page = this.ELC_list_container.ELC_current_page+1;
					ELC_update(this.ELC_list_container, "page");
				});
			}
		}
	}
	
	// TODO: Fix: This currently requires a perpage input element in order for pagination to function. Shouldn't be required.
	var perpages = document.getElementsByClassName("perpage");
	for(var i = 0; i < perpages.length; i++)
	{
		perpages[i].ELC_list_container = ELC_get_list_container(perpages[i], "paged", ["perpage", "page-group"]);
		if(perpages[i].ELC_list_container != null)
		{
			perpages[i].addEventListener("change", function(e){
				var val = parseInt(this.value);
				if(val)
					this.ELC_list_container.ELC_perpage = val;
				else
					this.value = this.ELC_list_container.ELC_perpage = 20; // find a way to let the user set the default?
				if(e.detail != "noupdate")
					ELC_update(this.ELC_list_container, "page");
			});
			perpages[i].dispatchEvent(new CustomEvent("change", {detail:"noupdate"}));
		}
	}
	// --- End paginating setup
	
	for(var i in all_containers)
	{
		if(all_containers[i].style.position == "static") // this is only needed if transitions are in use
			all_containers[i].style.position = "relative";
		if(all_containers[i].tagName == "TABLE")
		{
			if(all_containers[i].tBodies[0].ELC_MutationObserver == null)
				all_containers[i].tBodies[0].ELC_MutationObserver = new MutationObserver(ELC_element_added);
			all_containers[i].tBodies[0].ELC_MutationObserver.observe(all_containers[i], {childList:true});
		}
		else
		{
			if(all_containers[i].ELC_MutationObserver == null)
				all_containers[i].ELC_MutationObserver = new MutationObserver(ELC_element_added);
			all_containers[i].ELC_MutationObserver.observe(all_containers[i], {childList:true});
		}
		ELC_update(all_containers[i]);
	}
};

document.addEventListener("DOMContentLoaded", ELC_initialize);
