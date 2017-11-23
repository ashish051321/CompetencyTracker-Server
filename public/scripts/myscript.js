function reloadPage() {
    location.reload();
}

function extractFunction() {
  try{

    $.ajax({
    type: "POST",
    url: "parseit",
    data: {value: "parseit please", myurl: $('#inputtext').val()},   // <== change is here
    success: function(msg){
        // alert(msg);
        var win = window.open("", "Title", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=780, height=200, top="+(screen.height-400)+", left="+(screen.width-840));
        //win.document.body.innerHTML = msg;
        // var bodycontent = "<html><head></head><body>";
         var filteredmsg1 = msg.replace(/src=\"/g, "src=\"http://www.indiabix.com");//fixed the image problem
         $(filteredmsg1).find(".bix-tbl-container").each(function(){
           win.document.body.innerHTML += $(this).html();
         });


         $(win.document).find(".div-ans-des-wrapper").each(function(){
           var myanswer = $(this).find("p")[1];
           $(this).find("p").remove();
           $(this).append($(myanswer));
         });

      $(win.document).find(".jq-workspace").remove();
      $(win.document).find(".bix-ans-description").remove();
       $(win.document).find('td[id^="tdAnswerIMG"]').remove();

       }//sucess: function ends

    });//$ajax ends

        // bodycontent += "</body></html>"

        //win.document.body.innerHTML = bodycontent;
}
catch(e){
alert(e.message);
}


}
