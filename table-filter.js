/*
Version 1.2

Recommended CSS:

.filtered .filtered-out {
	display: none;
}
*/

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

var filter_columns = {};
$(function(){
	$(".filtered").bind("update", apply_filter);
	$(".filter").keyup(filter_changed).change(filter_changed).keyup();
	$(".filtered thead .filterable").each(function(i,e){ // why do we need .filterable? why not just add every column to this? perhaps to counter multiple header rows or colspan/rowspan
		if($(e).data("column"))
			filter_columns[$(e).data("column").toLowerCase()] = e.cellIndex;
		else
			filter_columns[$(e).html().toLowerCase()] = e.cellIndex;
	});
});