const kRoomSize = 6;

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function createArray(len) {
  array = new Array();
  for (var i = 0; i < len; i++) {
    array.push(0);
  }
  return array;
}

class Student {
  constructor(first_name, last_name, sex, row_idx) {
    this.first_name = first_name.trim();
    this.last_name = last_name.trim();
    this.sex = sex.trim();
    this.wanted = Array();
    this.not_wanted = Array();
    this.row_idx = row_idx;
    this.assigned_room = undefined;
  }

  full_name() {
    return this.first_name + ' ' + this.last_name;
  }

  // The number of |students| wanted by this student.
  numWantedBy(students) {
    var count = 0;
    for (var s = 0; s < students.length; s++) {
      if (this.wanted.includes(students[s])) {
        count += 1;
      }
    }
    return count
  }

  // The number of |students| not wanted by this student.
  numNotWantedBy(students) {
    var count = 0;
    for (var s = 0; s < students.length; s++) {
      if (this.not_wanted.includes(students[s])) {
        count += 1;
      }
    }
    return count
  }

  // The number of students wanted by me.
  numWanted() {
    return this.wanted.length;
  }

  // The number of satisfied wants in this students assigned room.
  numMetWanted() {
    if (!this.assigned_room) {
      return 0;
    }
    return this.numWantedBy(this.assigned_room.students);
  }

  // The number of |students| that want this student.
  numWantsMe(students) {
    let count = 0;
    for (var i = 0; i < students.length; i++) {
      if (students[i].wanted.includes(this)) {
        count++;
      };
    }
    return count;
  }

  // The number of students not wanted by all students in the
  // assigned room.
  numNotWantedByRoom() {
    if (!this.assigned_room) {
      return 0;
    }
    return this.numNotWantedBy(this.assigned_room.students);
  }

  print() {
    console.log('Name is :' + this.name);
  }
}

class Room {
  constructor(name) {
    this.name = name;
    this.students = Array();
  }

  isFull() {
    return this.students.length >= kRoomSize;
  }

  isEmpty() {
    return this.students.length == 0;
  }

  addStudent(student) {
    this.students.push(student);
    student.assigned_room = this;
  }

  removeStudent(student) {
    for (var i = 0; i < this.students.length; i++) {
      if (this.students[i] === student) {
        this.students.splice(i, 1);
        student.assigned_room = undefined;
        return;
      }
    }
  }

  // Calculate info about the number of satisfied wanted for the
  // students in this room.
  // 
  // Will return an array with the index is the number of satisfied
  // wanted, and the count is the number of students of that count.
  // 
  // For example: [1, 3, 1, 0, 0, 1] means:
  // 
  // * There are 1 students with 0 wanted met.
  // * There are 3 students with 1 wanted met.
  // * There are 1 students with 3 wanted met.
  // * There are 0 students with 4 wanted met.
  // * There are 0 students with 5 wanted met.
  // * There are 1 students with 6 wanted met.
  numMetWants() {
    let counts = createArray(kRoomSize);
    this.students.forEach(student => {
      counts[student.numMetWanted()] += 1;
    });
    return counts;
  }

  // The number of not-wanted votes for the students in this room.
  numUnwanted() {
    let count = 0;
    this.students.forEach(student => {
      count += student.numNotWantedBy(this.students);
    });
    return count;
  }

  // Calculate the number of "problems" with this room.
  calcMetric() {
    return this.numMetWants()[0] + this.numUnwanted();
  }
}

class Stats {
  constructor(rooms) {
    this.key_metric = 0;
    this.num_rooms = rooms.length;
    this.num_students = 0;
    this.num_wanted = Array();
    for (var i = 0; i < kRoomSize; i++) {
      this.num_wanted.push(0);
    }
    this.num_zero_pref = 0;
    this.num_unwanted = 0;

    rooms.forEach(room => {
      this.num_students += room.students.length;
      room.students.forEach(student => {
        if (student.numWanted()) {
          this.num_wanted[student.numMetWanted()] += 1;
        } else {
          this.num_zero_pref += 1;
        }
        this.num_unwanted += student.numNotWantedByRoom();
      });
    });

    this.success = this.num_wanted[0] / this.num_students;
    this.key_metric = this.num_wanted[0] + this.num_unwanted;
  }

  print() {
    console.log("Statistics");
    console.log("==========");
    console.log(`Number of rooms: ${this.num_rooms}`);
    console.log(`Number of students: ${this.num_students}`);
    console.log("Number of satisfied wanted:");
    console.log(`  -: ${this.num_zero_pref} (no preference)`);
    for (var i = 0; i < kRoomSize; i++) {
      let percent = 100 * this.num_wanted[i] / this.num_students;
      percent = Math.round(percent);
      console.log(`  ${i}: ${this.num_wanted[i]} (${percent}%)`);
    }
    console.log(`Number of students with unwanted roomates: ${this.num_unwanted}`);
    console.log(`zero+!wanted: ${this.key_metric}`);
  }
}

function fillRooms(rooms, students) {
  var s, r;
  for (s = 0; s < students.length; s++) {
    let foundRoom = false;
    for (r = 0; !foundRoom && r < rooms.length; r++) {
      if (rooms[r].isFull())
        continue;
      if (rooms[r].isEmpty()) {
        rooms[r].addStudent(students[s]);
        foundRoom = true;
        break;
      }

      const numWanted = [1, 2];
      // If nobody doesn't want me in the room and there are either
      // 1 or 2 students in the room that I want then assign me.
      if (students[s].numNotWantedBy(rooms[r].students) == 0 &&
        numWanted.includes(
          students[s].numWantedBy(rooms[r].students))) {
        rooms[r].addStudent(students[s]);
        foundRoom = true;
        break;
      }
    }

    if (foundRoom)
      continue;

    // Couldn't find a preference. Add to an empty room and hopefully
    // one of the un-added students will want this student.
    for (r = 0; r < rooms.length; r++) {
      if (!rooms[r].isFull()) {
        rooms[r].addStudent(students[s]);
        foundRoom = true;
        break;
      }
    }
  }
}

// Find all students that can leave a room where leaving will not
// negatively impact the other students (but may impact the leaver).
function findLeavers(rooms) {
  let leavers = Array();
  for (var r = 0; r < rooms.length; r++) {
    if (rooms[r].students.length < 2) {
      continue;
    }

    for (var s = 0; s < rooms[r].students.length; s++) {
      let student = rooms[r].students[s];
      if (student.numWantsMe(rooms[r].students) < 2) {
        // Doesn't satisfy any other students wants, so leaving
        // won't negatively impact others.
        leavers.push(student);
        continue;
      }
      // If others want me, but also have at least one other of their
      // wanted list then I can leave.
      let can_leave = true;
      for (var os = 0; os < rooms[r].students.length; os++) {
        let other_student = rooms[r].students[os];
        if (other_student == student) {
          continue;
        }
        if (other_student.wanted.includes(student) &&
          other_student.numMetWanted() > 1) {
          can_leave = false;
          break;
        }
      }
      if (can_leave) {
        leavers.push(student);
      }
    }
  }
  return leavers;
}

function swapRooms(student_a, student_b) {
  let room_a = student_a.assigned_room;
  let room_b = student_b.assigned_room;

  room_a.removeStudent(student_a);
  room_b.removeStudent(student_b);

  room_a.addStudent(student_b);
  room_b.addStudent(student_a);
}

function calcSwapImprovement(student_a, student_b) {
  let room_a_metric_before = student_a.assigned_room.calcMetric();
  let room_b_metric_before = student_b.assigned_room.calcMetric();

  swapRooms(student_a, student_b);

  let room_a_metric_after = student_a.assigned_room.calcMetric();
  let room_b_metric_after = student_b.assigned_room.calcMetric();

  swapRooms(student_a, student_b);

  // The metric is the number of problems, so the improvement
  // calculation is reversed.
  return room_a_metric_before - room_a_metric_after +
    room_b_metric_before - room_b_metric_after;
}

function bestSwap(student, leavers) {
  let best_measure = -1;
  let best = null;
  for (var i = 0; i < leavers.length; i++) {
    let leaver = leavers[i];
    if (student == leaver) {
      continue;
    }
    if (student.assigned_room == leaver.assigned_room) {
      continue;
    }
    let measure = calcSwapImprovement(student, leaver);
    if (measure > best_measure) {
      best_measure = measure;
      best = leaver;
    }
  }
  return best
}

function balanceRooms(rooms) {
  leavers = findLeavers(rooms);
  if (leavers.length == 0) {
    return false;
  }
  let idx = getRandomInt(leavers.length);
  let leaver = leavers[idx];
  swap = bestSwap(leaver, leavers)
  if (!swap) {
    return false;
  }

  swapRooms(leaver, swap);
  return true;
}

function group(students) {
  const num_rooms = Math.ceil(students.length) / kRoomSize;
  var rooms = Array();
  var i;
  for (i = 0; i < num_rooms; i++) {
    rooms.push(new Room("Room " + (i + 1)));
  }

  fillRooms(rooms, students);
  for (i = 0; i < 2000; i++) {
    balanceRooms(rooms);
    stats = new Stats(rooms);
    if (stats.key_metric == 0)
      break;
  }
  return rooms;
}

module.exports = {
  Student, Stats, group
}
