const kGroupSize = 6;

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
    this.assigned_group = undefined;
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

  // The number of satisfied wants in this students assigned group.
  numMetWanted() {
    if (!this.assigned_group) {
      return 0;
    }
    return this.numWantedBy(this.assigned_group.students);
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
  // assigned group.
  numNotWantedByGroup() {
    if (!this.assigned_group) {
      return 0;
    }
    return this.numNotWantedBy(this.assigned_group.students);
  }

  print() {
    console.log('Name is :' + this.name);
  }
}

class Group {
  constructor(name) {
    this.name = name;
    this.students = Array();
  }

  isFull() {
    return this.students.length >= kGroupSize;
  }

  isEmpty() {
    return this.students.length == 0;
  }

  addStudent(student) {
    this.students.push(student);
    student.assigned_group = this;
  }

  removeStudent(student) {
    for (var i = 0; i < this.students.length; i++) {
      if (this.students[i] === student) {
        this.students.splice(i, 1);
        student.assigned_group = undefined;
        return;
      }
    }
  }

  // Calculate info about the number of satisfied wanted for the
  // students in this group.
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
    let counts = createArray(kGroupSize);
    this.students.forEach(student => {
      counts[student.numMetWanted()] += 1;
    });
    return counts;
  }

  // The number of not-wanted votes for the students in this group.
  numUnwanted() {
    let count = 0;
    this.students.forEach(student => {
      count += student.numNotWantedBy(this.students);
    });
    return count;
  }

  // Calculate the number of "problems" with this group.
  calcMetric() {
    return this.numMetWants()[0] + this.numUnwanted();
  }
}

class Stats {
  constructor(groups) {
    this.key_metric = 0;
    this.num_groups = groups.length;
    this.num_students = 0;
    this.num_wanted = Array();
    for (var i = 0; i < kGroupSize; i++) {
      this.num_wanted.push(0);
    }
    this.num_zero_pref = 0;
    this.num_unwanted = 0;

    groups.forEach(group => {
      this.num_students += group.students.length;
      group.students.forEach(student => {
        if (student.numWanted()) {
          this.num_wanted[student.numMetWanted()] += 1;
        } else {
          this.num_zero_pref += 1;
        }
        this.num_unwanted += student.numNotWantedByGroup();
      });
    });

    this.success = this.num_wanted[0] / this.num_students;
    this.key_metric = this.num_wanted[0] + this.num_unwanted;
  }

  print() {
    console.log("Statistics");
    console.log("==========");
    console.log(`Number of groups: ${this.num_groups}`);
    console.log(`Number of students: ${this.num_students}`);
    console.log("Number of satisfied wanted:");
    console.log(`  -: ${this.num_zero_pref} (no preference)`);
    for (var i = 0; i < kGroupSize; i++) {
      let percent = 100 * this.num_wanted[i] / this.num_students;
      percent = Math.round(percent);
      console.log(`  ${i}: ${this.num_wanted[i]} (${percent}%)`);
    }
    console.log(`Number of students with unwanted groupates: ${this.num_unwanted}`);
    console.log(`zero+!wanted: ${this.key_metric}`);
  }
}

function fillGroups(groups, students) {
  var s, r;
  for (s = 0; s < students.length; s++) {
    let foundGroup = false;
    for (r = 0; !foundGroup && r < groups.length; r++) {
      if (groups[r].isFull())
        continue;
      if (groups[r].isEmpty()) {
        groups[r].addStudent(students[s]);
        foundGroup = true;
        break;
      }

      const numWanted = [1, 2];
      // If nobody doesn't want me in the group and there are either
      // 1 or 2 students in the group that I want then assign me.
      if (students[s].numNotWantedBy(groups[r].students) == 0 &&
        numWanted.includes(
          students[s].numWantedBy(groups[r].students))) {
        groups[r].addStudent(students[s]);
        foundGroup = true;
        break;
      }
    }

    if (foundGroup)
      continue;

    // Couldn't find a preference. Add to an empty group and hopefully
    // one of the un-added students will want this student.
    for (r = 0; r < groups.length; r++) {
      if (!groups[r].isFull()) {
        groups[r].addStudent(students[s]);
        foundGroup = true;
        break;
      }
    }
  }
}

// Find all students that can leave a group where leaving will not
// negatively impact the other students (but may impact the leaver).
function findLeavers(groups) {
  let leavers = Array();
  for (var r = 0; r < groups.length; r++) {
    if (groups[r].students.length < 2) {
      continue;
    }

    for (var s = 0; s < groups[r].students.length; s++) {
      let student = groups[r].students[s];
      if (student.numWantsMe(groups[r].students) < 2) {
        // Doesn't satisfy any other students wants, so leaving
        // won't negatively impact others.
        leavers.push(student);
        continue;
      }
      // If others want me, but also have at least one other of their
      // wanted list then I can leave.
      let can_leave = true;
      for (var os = 0; os < groups[r].students.length; os++) {
        let other_student = groups[r].students[os];
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

function swapGroups(student_a, student_b) {
  let group_a = student_a.assigned_group;
  let group_b = student_b.assigned_group;

  group_a.removeStudent(student_a);
  group_b.removeStudent(student_b);

  group_a.addStudent(student_b);
  group_b.addStudent(student_a);
}

function calcSwapImprovement(student_a, student_b) {
  let group_a_metric_before = student_a.assigned_group.calcMetric();
  let group_b_metric_before = student_b.assigned_group.calcMetric();

  swapGroups(student_a, student_b);

  let group_a_metric_after = student_a.assigned_group.calcMetric();
  let group_b_metric_after = student_b.assigned_group.calcMetric();

  swapGroups(student_a, student_b);

  // The metric is the number of problems, so the improvement
  // calculation is reversed.
  return group_a_metric_before - group_a_metric_after +
    group_b_metric_before - group_b_metric_after;
}

function bestSwap(student, leavers) {
  let best_measure = -1;
  let best = null;
  for (var i = 0; i < leavers.length; i++) {
    let leaver = leavers[i];
    if (student == leaver) {
      continue;
    }
    if (student.assigned_group == leaver.assigned_group) {
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

function balanceGroups(groups) {
  leavers = findLeavers(groups);
  if (leavers.length == 0) {
    return false;
  }
  let idx = getRandomInt(leavers.length);
  let leaver = leavers[idx];
  swap = bestSwap(leaver, leavers)
  if (!swap) {
    return false;
  }

  swapGroups(leaver, swap);
  return true;
}

function createGroups(students) {
  const num_groups = Math.ceil(students.length) / kGroupSize;
  var groups = Array();
  var i;
  for (i = 0; i < num_groups; i++) {
    groups.push(new Group("Group " + (i + 1)));
  }

  fillGroups(groups, students);
  for (i = 0; i < 2000; i++) {
    balanceGroups(groups);
    stats = new Stats(groups);
    if (stats.key_metric == 0)
      break;
  }
  return groups;
}

module.exports = {
  Student, Stats, createGroups
}
