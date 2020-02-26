
// npm i -s csv-parser
const csv = require('csv-parser');
const fs = require('fs');
var assigner = require("./Grouper.gs");


function writeRooms(fname, rooms) {
  lines = Array();
  rooms.forEach(room => {
    lines.push(room.name);
    lines.push('==============');
    room.students.forEach(student => {
      lines.push(`  ${student.full_name()}: ${student.numMetWanted()}`);
    });
  });

  fs.writeFile(fname, lines.join('\n'), (err) => {
    if (err) throw err;
    console.log(`${fname} written.`);
  });
}

function handleStudents(students) {
  console.log("There are " + students.length + " students.");
  room_students = Array();
  for (var i = 0; i < students.length; i++) {
    if (students[i].sex == 'M') {
      room_students.push(students[i]);
    }
  }
  rooms = assigner.group(room_students)
  writeRooms('males.txt', rooms);
  stats = new assigner.Stats(rooms);
  stats.print();
}

function readData() {
  const kColFirstName = 'First Name';
  const kColLastName = 'Smolyar';
  const kColSex = 'Gender';
  const kColWanted = [
    'Roommate #1 FIRST AND LAST NAME',
    'Roommate #2 FIRST AND LAST NAME',
    'Roommate #3 FIRST AND LAST NAME',
    'Roommate #4 FIRST AND LAST NAME',
    'Roommate #5 FIRST AND LAST NAME',
    'Roommate #6 FIRST AND LAST NAME',
  ];
  const kColNotWanted = 'No';

  // student full name => student
  let student_names = Object();

  // Array of all students.
  let students = Array();
  let row_idx = 1;
  fs.createReadStream('rooms.csv')
    .pipe(csv())
    .on('data', (row) => {
      let student = new assigner.Student(row[kColFirstName],
        row[kColLastName], row[kColSex]);

      if (student.full_name() in student_names) {
        console.error("\"" + student.full_name() + "\" is duplicated.");
      }
      student.wanted_names = [];
      kColWanted.forEach(prop => {
        if (prop in row) {
          student.wanted_names.push(row[prop]);
        }
      });
      student.not_wanted_names = [];
      if (kColNotWanted in row) {
        student.not_wanted_names = row[kColNotWanted].split(",");
      }
      student.row_idx = row_idx++;
      student_names[student.full_name()] = student;
      students.push(student);
      //if (kColFirstName in row)
    })
    .on('end', () => {
      // Resolve wanted/unwanted students which we can only do once
      // all names have been loaded.
      for (i = 0; i < students.length; i++) {
        students[i].wanted_names.forEach(name => {
          if (name in student_names) {
            students[i].wanted.push(student_names[name]);
          }
        });
        students[i].not_wanted_names.forEach(name => {
          if (name in student_names) {
            students[i].not_wanted.push(student_names[name]);
          }
        });
        delete students[i].wanted_names;
        delete students[i].not_wanted_names;
      }
      console.log(students[12]);
      handleStudents(students);
    });
}

readData();
