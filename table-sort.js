/*
Version 1.0

Usage:

Quick instructions: Add the "sortable" class to a <table>. The table must use the <thead> and <tbody> tags to distinguish header rows from the table body. Add the "sort" class to the header cells (<th> or <td>) of columns that you want to be sortable. The "data-type" attribute can be used in the header cell for non-plain-text columns (data-type="number" for numeric values, data-type="link" to sort by the text inside an <a> tag). You can also add the "sort-animated" class to the <table> if you want the sorting to be animated instead of instant; this is not recommended for paged tables or very large tables. If the "sort" cells are not in the first <tr> of the <thead> *and* that <tr> contains cells using "colspan" attributes, then you'll need to add the "sorter" class to that <tr>.

Recommended CSS:

.sortable .sort {
	cursor: pointer;
	-webkit-user-select: none;
	-moz-user-select: none;
	-khtml-user-select: none;
	-ms-user-select: none;
}

.sortable .sortup:after {
	content: "\2191";
}

.sortable .sortdown:after {
	content: "\2193";
}
*/

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

$(function(){
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
});