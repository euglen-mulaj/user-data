$(document).ready(function () {
  console.log("ready!");
  var tableData = $('#tableData').DataTable({
    ajax: '/api/getAllData',
    order:[[0,"desc"]],
    dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ]
  });

  //load table data on page load
  $.get("/api/getAllData")
  .done(function (response) {
    console.log(response);
  })
  .fail(function (jqxhr, settings, ex) {
    console.log(ex);
  })
  .always(function () {
  });

  $("form").on("submit", function (event) {
    event.preventDefault();
    $.LoadingOverlay("show");
  
    let formDataArray = $("#testForm")
      .serializeArray()
      .reduce(function (obj, item) {
        obj[item.name] = item.value;
        return obj;
      }, {});
    console.log(formDataArray);
    $.post("/api/user", formDataArray)
      .done(function (response) {
        console.log(response);
        $("#testForm").trigger("reset");
        toastr.success("User was added");
        tableData.ajax.reload();
      })
      .fail(function (jqxhr, settings, ex) {
        console.log(ex);
      })
      .always(function () {
        $.LoadingOverlay("hide");
      });
  });

  $( "#tableData tbody" ).on( "click", "[data-delete]", function() {
    console.log( $( this ).data("delete") );
    let userID = $( this ).data("delete");
    deleteUser(userID);
  });

  function deleteUser(id){
    $.LoadingOverlay("show");
    $.post("/api/user/delete",{id: id})
    .done(function (response) {

      console.log(response);
      toastr.success("User was deleted");
      tableData.ajax.reload();
    })
    .fail(function (jqxhr, settings, ex) {
      console.log(ex);
    })
    .always(function () {
        $.LoadingOverlay("hide");
    });
  }
});

