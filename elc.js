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

// ---- Begin sorting functions ----
function ELC_sort_list()
{
	var list = (this.tagName=="TABLE" ? this.tBodies[0] : this);
	for(var i = 0; i < list.children.length; i++)
	{
		if(this.tagName == "TABLE")
		{
			if(this.ELC_current_sort_type == "number")
				list.children[i].ELC_current_sort_value = parseFloat(list.children[i].children[this.ELC_current_sort_field].innerText);
			else if(this.ELC_current_sort_type == "html")
				list.children[i].ELC_current_sort_value = list.children[i].children[this.ELC_current_sort_field].innerHTML;
			else
				list.children[i].ELC_current_sort_value = list.children[i].children[this.ELC_current_sort_field].innerText;
		}
		else
		{
			if(list.children[i].dataset[this.ELC_current_sort_field+"Value"] != null)
				var string = list.children[i].dataset[this.ELC_current_sort_field+"Value"];
			else
			{
				var element = list.children[i].getFirstElementByName(this.ELC_current_sort_field);
				if(element != null)
					var string = (element.dataset.value!=null ? element.dataset.value : (this.ELC_current_sort_type=="html" ? element.innerHTML : element.innerText));
				else
					var string = "";
			}
			if(this.ELC_current_sort_type == "number")
				list.children[i].ELC_current_sort_value = parseFloat(string);
			else
				list.children[i].ELC_current_sort_value = string;
		}
	}
	ELC_merge_sort(list.children, this, list);
	ELC_update_offsets.call(this, this.ELC_animated);
	$(this).triggerHandler("update");
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
	one = null;
	two = null;
}

function ELC_compare(a, b, container)
{
	if(container.ELC_current_sort_type == "number")
		return (container.ELC_current_sort_reversed?-1:1) * (a.ELC_current_sort_value - b.ELC_current_sort_value);
	else
		return (container.ELC_current_sort_reversed?-1:1) * b.ELC_current_sort_value.localeCompare(a.ELC_current_sort_value);
}

function ELC_update_offsets(animate)
{
	$(this).children("tbody").children("tr").each(function(i,row){
		diff = row.offsetTopSaved - row.offsetTop;
		row.offsetTopSaved = row.offsetTop;
		if(animate && diff)
			$(row).children().css("position", "relative").css("top", diff+"px").animate({"top": ""});
	});
}
// ---- End sorting functions ----

// ---- Begin filtering functions ----
function apply_filter(event)
{
	var table = $(event.target);
	var column_filters_and = {};
	var column_filters_or = {};
	var column_filters_not = {};
	$(".filter").each(function(i,e){
		if($(e).data("table"))
			var mytable = $($(e).data("table"));
		else
			var mytable = $(e).parents(".filtered").first();
		if(mytable.index(event.target) == -1)
			return;
		
		if($(e).data("column"))
		{
			if($(e).data("column").substr(0,5) == "data:")
				var column = $(e).data("column");
			else
				var column = $(e).data("column").toLowerCase();
		}
		else
			var column = "";
		if(!column_filters_and[column])
			column_filters_and[column] = [];
		if(!column_filters_or[column])
			column_filters_or[column] = [];
		if(!column_filters_not[column])
			column_filters_not[column] = [];
		switch($(e).attr("type"))
		{
			case "checkbox":
				if($(e).filter(":checked").length > 0 && $(e).val().length > 0)
					column_filters_or[column].push($(e).val());
				break;
			case "radio":
				if($(e).filter(":checked").length > 0 && $(e).val().length > 0)
					column_filters_and[column].push($(e).val());
				break;
			case "number":
				if($(e).val().length > 0)
					column_filters_and[column].push($(e).val());
				break;
			case "text":
			case "":
				var string = $(e).val();
				if(string)
				{
					var strings = string.split(" ");
					for(var s in strings)
					{
						if(strings[s][0] == "+" && strings[s].length > 1)
						{
							column_filters_and[column].push(strings[s].substr(1));
						}
						else if(strings[s][0] == "|" && strings[s].length > 1)
						{
							column_filters_or[column].push(strings[s].substr(1));
						}
						else if(strings[s][0] == "-" && strings[s].length > 1)
						{
							column_filters_not[column].push(strings[s].substr(1));
						}
						else if(strings[s].length > 0)
						{
							column_filters_and[column].push(strings[s]);
						}
					}
				}
				break;
		}
	});
	var rows = table.children("tbody").children("tr");
	rows.removeClass("filtered-out");
	rows.each(function(i,e){
		for(var k in column_filters_and) // & column_filters_or & column_filters_not - they should all have the same keys
		{
			var is_attr = false;
			if(k)
			{
				if(k.substr(0,5) == "data:")
				{
					var text = $(e).data(k.substr(5));
					is_attr = true;
				}
				else
					var text = $(e).children("td, th").eq(filter_columns[k]).html().toLowerCase();
			}
			else
				var text = $(e).html().toLowerCase();
			
			var and_clause = true;
			if(column_filters_and[k] && column_filters_and[k].length > 0)
			{
				for(var j in column_filters_and[k])
				{
					if(is_attr)
					{
						//console.log("and:"+ k +"["+ j +"] = "+ column_filters_and[k][j] +" :: "+ (text == column_filters_and[k][j]));
						if(text != column_filters_and[k][j])
						{
							and_clause = false;
							break;
						}
					}
					else
					{
						try // There should be no blank strings in the array, but just in case...
						{
							if(text.indexOf(column_filters_and[k][j].toLowerCase()) == -1)
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
			}
			
			var or_clause = true;
			if(column_filters_or[k] && column_filters_or[k].length > 0)
			{
				or_clause = false;
				for(var j in column_filters_or[k])
				{
					if(is_attr)
					{
						//console.log("or:"+ k +"["+ j +"] = "+ column_filters_or[k][j] +" :: "+ (text == column_filters_or[k][j]));
						if(text == column_filters_or[k][j])
						{
							console.log(k +": "+ or_clause);
							or_clause = true;
							break;
						}
					}
					else
					{
						try // There should be no blank strings in the array, but just in case...
						{
							if(text.indexOf(column_filters_or[k][j].toLowerCase()) != -1)
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
			}
			
			var not_clause = true;
			if(column_filters_not[k] && column_filters_not[k].length > 0)
			{
				for(var j in column_filters_not[k])
				{
					if(is_attr)
					{
						//console.log("not:"+ k +"["+ j +"] = "+ column_filters_not[k][j] +" :: "+ (text != column_filters_not[k][j]));
						if(text == column_filters_not[k][j])
						{
							not_clause = false;
							break;
						}
					}
					else
					{
						try // There should be no blank strings in the array, but just in case...
						{
							if(text.indexOf(column_filters_not[k][j].toLowerCase()) != -1)
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
			}
			
			if(!and_clause || !or_clause || !not_clause)
			{
				$(e).addClass("filtered-out");
				break;
			}
		}
	});
	if($(".filter-list").length)
	{
		$(".filter-list").html("");
		for(var i in column_filters_and)
			if(column_filters_and[i].length > 0)
				for(var k in column_filters_and[i])
					$(".filter-list").append("<span class='filter-and' data-column='"+ i +"' data-value='"+ column_filters_and[i][k] +"'>"+ (i?i+":":"") + column_filters_and[i][k] +"</span>");
		for(var i in column_filters_or)
			if(column_filters_or[i].length > 0)
				for(var k in column_filters_or[i])
					$(".filter-list").append("<span class='filter-or' data-column='"+ i +"' data-value='"+ column_filters_or[i][k] +"'>"+ (i?i+":":"") + column_filters_or[i][k] +"</span>");
		for(var i in column_filters_not)
			if(column_filters_not[i].length > 0)
				for(var k in column_filters_not[i])
					$(".filter-list").append("<span class='filter-not' data-column='"+ i +"' data-value='"+ column_filters_not[i][k] +"'>"+ (i?i+":":"") + column_filters_not[i][k] +"</span>");
		$(".filter-list *").click(remove_filter);
	}
}

var filter_delay = setTimeout(function(){}, 1);
function filter_changed(e)
{
	clearTimeout(filter_delay);
	if($(this).data("table"))
		var table = $($(this).data("table"));
	else
		var table = $(this).parents(".filtered").first();
	if(table.length == 0)
	{
		console.log("Cannot find the table this filter is meant to apply to: "+ $(this));
		return false;
	}
	if(e.type == "keyup") // Give user some "time" to finish typing.
		filter_delay = setTimeout(function(t){t.triggerHandler("update");}, 250, table);
	else
		table.triggerHandler("update");
}

function remove_filter(e)
{
	console.log($(this).parentsUntil(".filter-list"));
}
// ---- End filtering functions ----

// ---- Begin paginating functions ----
function display_page(e)
{
	var table = $(e.target);
	var page = table.data("page");
	var perpage = table.data("perpage");
	var rows = table.children("tbody").children("tr").not(".filtered-out"); // determine if filter excludes them
	
	if(page <= 0)
	{
		table.find(".pageup").removeClass("active");
		page = 0;
		table.data("page", page);
	}
	else
		table.find(".pageup").addClass("active");
	
	if(page + 1 >= rows.length / perpage)
	{
		table.find(".pagedown").removeClass("active");
		page = Math.ceil(rows.length/perpage) - 1;
		table.data("page", page);
	}
	else
		table.find(".pagedown").addClass("active");
	
	var alt = false;
	rows.removeClass("paged-out odd even").each(function(i,e){
		if(i < page*perpage || i >= (page+1)*perpage)
			$(e).addClass("paged-out");
		else
		{
			$(e).addClass(alt ? "even" : "odd");
			alt = !alt;
		}
	});
	table.find(".page").html("Page " + (page+1) + " of " + Math.ceil(rows.length/perpage));
}
// ---- End paginating functions ----

var filter_columns = {};
$(function(){
	// --- Begin sorting setup
	var sortables = document.getElementsByClassName("sortable");
	for(var i = 0; i < sortables.length; i++)
	{
		sortables[i].ELC_list_sorters = [];
		if(sortables[i].style.position == "static")
			sortables[i].style.position = "relative";
		if(sortables[i].classList.contains("sort-animated"))
			sortables[i].ELC_animated = true;
		else
			sortables[i].ELC_animated = false;
	}
	
	var sorts = document.getElementsByClassName("sort");
	for(var i = 0; i < sorts.length; i++)
	{
		var current = sorts[i];
		do {
			if(current.classList.contains("sortable"))
				sorts[i].ELC_list_container = current;
			else if(current.classList.contains("sorter") && current.dataset.container != null)
				sorts[i].ELC_list_container = document.getElementById(current.dataset.container);
			current = current.parentElement;
		} while(current != null && sorts[i].ELC_list_container == null);
		
		if(sorts[i].ELC_list_container != null)
		{
			if(sorts[i].ELC_list_container.tagName == "TABLE")
			{
				if(sorts[i].cellIndex > -1 && sorts[i].ELC_sort_field == null)
				{
					var offset = 0;
					for(var k = 0; k < sorts[i].parentElement.children.length; k++)
					{
						if(sorts[i].parentElement.children[k].cellIndex > -1)
						{
							sorts[i].parentElement.children[k].ELC_sort_field = sorts[i].parentElement.children[k].cellIndex + offset;
							offset += sorts[i].parentElement.children[k].colSpan - 1;
						}
					}
				}
			}
			else if(sorts[i].dataset.field != null && sorts[i].dataset.field != "")
				sorts[i].ELC_sort_field = sorts[i].dataset.field;
			else
				sorts[i].ELC_sort_field = (sorts[i].innerText!=null ? sorts[i].innerText : sorts[i].textContent);
			
			if(sorts[i].dataset.type == "number" || sorts[i].dataset.type == "html" || sorts[i].dataset.type == "text")
				sorts[i].ELC_sort_type = sorts[i].dataset.type;
			else
				sorts[i].ELC_sort_type = "text";
			
			sorts[i].ELC_list_container.ELC_list_sorters.push(sorts[i]);
			
			sorts[i].addEventListener("click", function(event){
				for(var k in this.ELC_list_container.ELC_list_sorters)
				{
					this.ELC_list_container.ELC_list_sorters[k].classList.remove("sortup");
					this.ELC_list_container.ELC_list_sorters[k].classList.remove("sortdown");
					if(this.ELC_list_container.ELC_list_sorters[k].ELC_sort_field == this.ELC_sort_field)
					{
						if(this.ELC_list_container.ELC_current_sort_field == this.ELC_sort_field && this.ELC_list_container.ELC_current_sort_reversed == false)
							this.ELC_list_container.ELC_list_sorters[k].classList.add("sortup");
						else
							this.ELC_list_container.ELC_list_sorters[k].classList.add("sortdown");
					}
				}
				this.ELC_list_container.ELC_current_sort_type = this.ELC_sort_type;
				if(this.ELC_list_container.ELC_current_sort_field == this.ELC_sort_field)
				{
					this.ELC_list_container.ELC_current_sort_reversed = !this.ELC_list_container.ELC_current_sort_reversed;
				}
				else
				{
					this.ELC_list_container.ELC_current_sort_field = this.ELC_sort_field;
					this.ELC_list_container.ELC_current_sort_reversed = false;
				}
				ELC_sort_list.call(this.ELC_list_container);
			});
		}
	}
	
	var initial_sorts = document.getElementsByClassName("sort-initial");
	for(var i = 0; i < initial_sorts.length; i++)
		initial_sorts[i].dispatchEvent(new Event('click'));
	// --- End sorting setup
	
	// --- Begin filtering setup
	$(".filtered").bind("update", apply_filter);
	$(".filter").keyup(filter_changed).change(filter_changed).keyup();
	$(".filtered thead .filterable").each(function(i,e){ // why do we need .filterable? why not just add every column to this? perhaps to counter multiple header rows or colspan/rowspan
		if($(e).data("column"))
			filter_columns[$(e).data("column").toLowerCase()] = e.cellIndex;
		else
			filter_columns[$(e).html().toLowerCase()] = e.cellIndex;
	});
	// --- End filtering setup
	
	// --- Begin paginating setup
	$(".paged").bind("update", display_page).data("page", 0);
	
	$(".paged .pageup").click(function(e){
		var table = $(this).parents("table").first();
		if(table.data("page") == 0)
			return false;
		else
			table.data("page", table.data("page")-1);
		table.triggerHandler("update");
	});
	
	$(".paged .pagedown").click(function(e){
		var table = $(this).parents("table").first();
		if(table.data("page")+1 >= table.children("tbody").children("tr").length / table.data("perpage"))
			return false;
		else
			table.data("page", table.data("page")+1);
		table.triggerHandler("update");
	});
	
	$(".paged .perpage").change(function(e){
		var table = $(this).parents("table").first();
		var val = parseInt($(this).val());
		if(val)
			table.data("perpage", val);
		else
		{
			table.data("perpage", 20);
			$(this).val(20);
		}
		table.triggerHandler("update");
	}).change();
	// --- End paginating setup
});