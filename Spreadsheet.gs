// The column numbers start at 1.
const kColFirstName = 1;
const kColLastName = 2;
const kColSex = 3;
const kFirstWantedCol = 6;
const kLastWantedCol = 11;
const kNotWantedCol = 14;


function layoutRooms(students, sheet) {
  let rooms = makeAndFillRooms(students);
  let stats = new Stats(rooms);

  sheet.clear();

  let values = Array();
  values.push(['Name', 'Met "wants"', 'Wanted']);
  let rows_to_merge = Array();
  let row_idx = 1;
  for (var r = 0; r < rooms.length; r++) {
    let room = rooms[r];
    values.push([room.name, '', '']);
    rows_to_merge.push(row_idx++);
    for (var s = 0; s < room.students.length; s++) {
      let student = room.students[s];
      let wanted = [];
      for (var w = 0; w < student.wanted.length; w++) {
        wanted.push(student.wanted[w].full_name());
      }
      values.push([student.full_name(), student.numMetWanted(), wanted.join(', ')]);
      row_idx++
    }
    values.push(['', '', '']);
    row_idx++
  }

  let numRows = values.length;
  let numColumns = values[0].length;
  let range = sheet.getRange(1, 1, numRows, numColumns);
  range.setValues(values);

  // Style
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, numColumns).setFontWeight("bold");

  rows_to_merge.forEach(row_idx => {
    range = sheet.getRange(1 + row_idx, 1, 1, numColumns);
    var backColors = range.getBackgroundColors();
    range.merge();
    backColors[0][0] = 'lightblue';
    range.setBackgroundColors(backColors);
    range.setFontWeight("bold");
  });

  sheet.autoResizeColumns(1, numColumns);
}

function layoutAllRooms() {
  male_students = Array();
  female_students = Array();
  students = readStudentData();
  for (var i = 0; i < students.length; i++) {
    if (students[i].sex == 'M') {
      male_students.push(students[i]);
    } else if (students[i].sex == 'F') {
      female_students.push(students[i]);
    }
  }

  layoutRooms(male_students,
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Male Rooms"));
  layoutRooms(female_students,
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Female Rooms"));
}

function readStudentData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Student Data");

  const idxFirstRow = 1;
  var idxLastRow = sheet.getLastRow();
  var numRows = idxLastRow - idxFirstRow + 1;
  const idxFirstCol = 1;
  const numColumns = 16;

  var range = sheet.getRange(idxFirstRow, idxFirstCol, numRows, numColumns);
  var values = range.getValues();
  var backColors = range.getBackgroundColors();
  var fontColors = range.getFontColors();

  let students = Array();

  // student full name => student
  let student_names = Object();

  for (var r = idxFirstRow; r < idxLastRow; r++) {
    let row = values[r];
    student = new Student(
      row[kColFirstName],
      row[kColLastName],
      row[kColSex],
      r);

    if (student.full_name() in student_names) {
      console.log(`Duplicate student name: "${student.full_name()}" - ignoring`);
      continue;
    }

    student.wanted_names = Array();
    for (var c = kFirstWantedCol; c <= kLastWantedCol; c++) {
      student.wanted_names.push(row[c]);
    }

    if (row[kNotWantedCol]) {
      student.not_wanted_names = row[kNotWantedCol].split(",");
    }

    student_names[student.full_name()] = student;
    students.push(student);
  }

  // Now that all the student names are known, resolve wanted/unwanted names.
  students.forEach(
    student => {
      c = kFirstWantedCol;
      student.wanted_names.forEach(
        name => {
          name = name.trim();
          if (name != '' && name in student_names) {
            student.wanted.push(student_names[name]);
          }
          c++;
        });

      if (!student.not_wanted_names) {
        return;
      }
      student.not_wanted_names.forEach(
        name => {
          name = name.trim();
          if (name != '' && name in student_names) {
            student.not_wanted.push(student_names[name]);
          }
        });
    });

  return students;
}

function validateStudentData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Student Data");

  const idxFirstRow = 1;
  var idxLastRow = sheet.getLastRow();
  var numRows = idxLastRow - idxFirstRow + 1;
  const idxFirstCol = 1;
  const numColumns = 16;

  var range = sheet.getRange(idxFirstRow, idxFirstCol, numRows, numColumns);
  var values = range.getValues();
  var backColors = range.getBackgroundColors();
  var fontColors = range.getFontColors();

  let students = Array();

  // student full name => student
  let student_names = Object();

  for (var r = idxFirstRow; r < idxLastRow; r++) {
    let row = values[r];
    student = new Student(
      row[kColFirstName],
      row[kColLastName],
      row[kColSex],
      r);

    if (student.sex == 'M' || student.sex == 'F') {
      backColors[r][kColSex] = "";
      fontColors[r][kColSex] = "";
    } else {
      backColors[r][kColSex] = "red";
      fontColors[r][kColSex] = "white";
    }

    if (student.full_name() in student_names) {
      backColors[r][kColFirstName] = "red";
      backColors[r][kColLastName] = "red";
      fontColors[r][kColFirstName] = "white";
      fontColors[r][kColLastName] = "white";
    } else {
      backColors[r][kColFirstName] = "";
      backColors[r][kColLastName] = "";
      fontColors[r][kColFirstName] = "";
      fontColors[r][kColLastName] = "";
    }

    student.wanted_names = Array();
    for (var c = kFirstWantedCol; c <= kLastWantedCol; c++) {
      student.wanted_names.push(row[c]);
    }

    if (row[kNotWantedCol]) {
      student.not_wanted_names = row[kNotWantedCol].split(",");
    }

    student_names[student.full_name()] = student;
    students.push(student);
  }

  // Now that all the student names are known flag those (wanted/not-wanted)
  // which are not present.
  students.forEach(
    student => {
      c = kFirstWantedCol;
      student.wanted_names.forEach(
        name => {
          name = name.trim();
          if (name == '' || name in student_names) {
            backColors[student.row_idx][c] = "";
          } else {
            backColors[student.row_idx][c] = "orange";
          }
          c++;
        });

      backColors[student.row_idx][kNotWantedCol] = "";
      if (!student.not_wanted_names) {
        return;
      }
      student.not_wanted_names.forEach(
        name => {
          name = name.trim();
          if (name == '') {
            return;
          }
          if (!(name in student_names)) {
            backColors[student.row_idx][kNotWantedCol] = "orange";
            return;
          }
        });
    });

  // Setting/getting is expensive so only do once for entire range
  range.setBackgroundColors(backColors);
  range.setFontColors(fontColors);

  SpreadsheetApp.flush();
}

function onEdit(event) {
  validateStudentData();
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Or DocumentApp or FormApp.
  ui.createMenu('Rooms')
    .addItem('Generate Assignments', 'layoutAllRooms')
    .addToUi();
  validateStudentData();
}
