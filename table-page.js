/*
Version 1.0

Recommended CSS:

.paged .paged-out {
	display: none;
}

.paged .pageup,
.paged .pagedown {
	cursor: pointer;
	-webkit-user-select: none;
	-moz-user-select: none;
	-khtml-user-select: none;
	-ms-user-select: none;
	opacity: 0.5;
}

.paged .pageup.active,
.paged .pagedown.active {
	opacity: 1;
}
*/

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

// This needs the other table scripts to finish first. While this could also be accomplished by loading this javascript last, that's annoying to remember.
function delay_display_page(e)
{
	setTimeout(display_page, 1, e);
}

$(function(){
	$(".paged").bind("update", delay_display_page).data("page", 0);
	
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
});