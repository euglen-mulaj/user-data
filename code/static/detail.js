$(document).ready(function () {

//get the id of the selected record
let searchParams = new URLSearchParams(window.location.search);
if(searchParams.has('id')){
    let param = searchParams.get('id');
    console.log(param);

  //load selected user detail
  $.get("/api/user/detail",{id: param})
  .done(function (response) {
    console.log(response);
    let userDetail = response.data;

    $('input[name="first"]').val(userDetail.firstname);
    $('input[name="last"]').val(userDetail.lastname);
    $('input[name="email"]').val(userDetail.email);
    
  })
  .fail(function (jqxhr, settings, ex) {
    console.log(ex);
  })
  .always(function () {
  });

  $("form").on("submit", function (event) {
    event.preventDefault();
    $.LoadingOverlay("show");
  
    let formDataArray = $("#detailForm")
      .serializeArray()
      .reduce(function (obj, item) {
        obj[item.name] = item.value;
        return obj;
      }, {});
    formDataArray.id = param;

    console.log(formDataArray);
    $.post("/api/user/update", formDataArray)
      .done(function (response) {
        console.log(response);
        toastr.success("User was updated");
      })
      .fail(function (jqxhr, settings, ex) {
        console.log(ex);
      })
      .always(function () {
        $.LoadingOverlay("hide");
      });
  });

}



});