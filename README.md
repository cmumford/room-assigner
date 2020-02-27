# student-grouper
Application to assign students to groups based on grouping preferences.

Students may have zero or more preferred preferred students, and
zero or more not-preferred students. This program will attempt to
put students into groups (of a fixed size) where every student
has at least one student from their preferred list and zero
from their not-preferred list.

This is a very basic brute force approach to solving this problem,
but for relatively small numbers of students and a sufficiently
large number of preferences works well enough.

```sh
npm install -g typescript
npm install -s csv-parser
npm i -S @types/google-apps-script
npm install -g @google/clasp
```

To run the test program:

```sh
make
```

To install into Google Sheets copy Shareadsheet.gs and Grouper.gs
into Google Apps and incorporate into your spreadsheet.
