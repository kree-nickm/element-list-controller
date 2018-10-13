// ---- Begin sorting functions ----
function sort_rows(e, head, animate)
{
	if(!$(head).hasClass("sort"))
		return true;
	var table = $(e.target);
	var key = table.data("sortkey");
	var col = key<0 ? -1*key-1 : key;
	var type = $(head).attr("data-type");
	var body = table.children("tbody");
	body.children("tr").each(function(i,e){ // need a new algorithm here, insertion sort is proving to be slow as heck
		body.children("tr").each(function(k,e2){
			// Check if we're comparing the same element to itself.
			if(k == i)
				return false;
			
			// Get the cells to compare. This includes the encompassing <td> or <th> tags.
			myVal = $(e).children("tr :eq("+col+")");
			hisVal = $(e2).children("tr :eq("+col+")");
			
			if(myVal.html() == "")
				return false;
			else if(hisVal.html() == "")
			{
				$(e).insertBefore(e2);
				return false;
			}
			
			if(type == "number") // numeric comparison
			{
				myVal = parseFloat(myVal.html());
				hisVal = parseFloat(hisVal.html());
				if(key != col && myVal < hisVal || key == col && myVal > hisVal)
				{
					$(e).insertBefore(e2);
					return false;
				}
			}
			else if(type == "link")  // link comparison
			{
				myVal = myVal.children("a:first").html();
				hisVal = hisVal.children("a:first").html();
				if(key != col && hisVal.localeCompare(myVal) < 0 || key == col && hisVal.localeCompare(myVal) > 0)
				{
					$(e).insertBefore(e2);
					return false;
				}
			}
			else
			{
				myVal = myVal.html();
				hisVal = hisVal.html();
				if(key != col && hisVal.localeCompare(myVal) < 0 || key == col && hisVal.localeCompare(myVal) > 0)
				{
					$(e).insertBefore(e2);
					return false;
				}
			}
		});
	});
	table.triggerHandler("save", [animate]);
}

function update_offsets(e, animate)
{
	$(e.target).children("tbody").children("tr").each(function(i,row){
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
	$(".sortable").bind("update", sort_rows).bind("save", update_offsets).css("position", "relative");
	
	// Currently only useful to account for "colspan". Should be made compatible with "rowspan" as well.
	var sorter = $(".sortable thead .sorter th:first, .sortable thead .sorter td:first");
	if(sorter.length == 0)
		sorter = $(".sortable thead tr:first th:first, .sortable thead tr:first td:first");
	sorter.each(function(e){
		cell = $(this);
		offset = 0;
		while(cell.length)
		{
			cell.prop("sortIndex", cell.prop("cellIndex")+offset);
			offset += cell.prop("colSpan") - 1;
			cell = cell.next();
		}
	});
	
	$(".sortable thead .sort").click(function(e){
		var col = this.sortIndex!=null ? this.sortIndex : this.cellIndex;
		var table = $(this).parents("table.sortable").first();
		$(this).siblings().addBack().removeClass("sortup sortdown");
		if(table.data("sortkey") == col)
		{
			$(this).addClass("sortup");
			table.data("sortkey", -1*col-1);
		}
		else
		{
			$(this).addClass("sortdown");
			table.data("sortkey", col);
		}
		table.prop("lastClick", e);
		table.triggerHandler("update", [this, table.hasClass("sort-animated")]);
	});//.eq(0).click();
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