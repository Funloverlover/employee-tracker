var inquirer = require('inquirer');
var db = require("./db.js");
var { table: tableify } = require("table");

function printTable(list) {
    list.unshift(Object.keys(list[0]).map(t => t.toUpperCase()));
    list = list.map(e => Object.values(e));
    console.log(tableify(list));
}

function promptInquirer() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'prompt',
            message: "What would you like to do?",
            choices: [
                {
                    "name": "View all Departments",
                    "value": "view all departments"
                },
                {
                    "name": "Add a Department",
                    "value": "add a department"
                },
                {
                    "name": "View all Roles",
                    "value": "view all roles"
                },
                {
                    "name": "Add a Role",
                    "value": "add a role"
                },
                {
                    "name": "View all Employees",
                    "value": "view all employees"
                },
                {
                    "name": "Add an Employee",
                    "value": "add an employee"
                },
                {
                    "name": "Update Employee Role",
                    "value": "update employee role"
                }
            ]
        }
    ]).then(({ prompt: p }) => {
        switch (p) {
            case "view all departments": {
                getDepartments((error, departments) => {
                    printTable(departments);
                    promptInquirer();
                });
            } break;
            case "add a department": {
                promptString("Department Name", (name) => {
                    addDepartment(name, (error, data) => {
                        data = `Added ${name} to the database`;
                        console.log(data);
                        promptInquirer();
                    });
                });
            } break;
            case "view all roles": {
                getRoles((error, roles) => {
                    getDepartments((error, departments) => {
                        for (let i = 0; i < roles.length; i++) {
                            let r = roles[i];
                            if (r.department_id == null) r.department = null;
                            else r.department = departments.find(d => d.id == r.department_id).name;
                            delete r.department_id;
                        }
                        printTable(roles);
                        promptInquirer();
                    });
                });
            } break;
            case "add a role": {
                promptString("Role Title", (title) => {
                    promptInteger("Role Salary", (salary) => {
                        getDepartments((error, departmentData) => {
                            let choices = [];
                            departmentData.forEach(({ name, id }) => {
                                choices.push({ name, value: id });
                            })
                            promptChoices("Pick a Department", choices, (department_id) => {
                                addRole([title, salary, department_id], (error, data) => {
                                    data = `Added ${title} to the database with salary of ${salary}`;
                                    console.log(data);
                                    promptInquirer();
                                });
                            });
                        });
                    });
                });
            } break;
            case "view all employees": {
                getEmployees((error, employees) => {
                    getRoles((error, roles) => {
                        for (let i = 0; i < employees.length; i++) {
                            let e = employees[i];
                            if (e.role_id == null) e.role = null;
                            else e.role = roles.find(r => r.id == e.role_id).title;
                            if (e.manager_id == null) e.manager = null;
                            else {
                                let m = employees.find(r => r.id == e.manager_id);
                                if (m === undefined) e.manager = undefined;
                                else e.manager = m.first_name + " " + m.last_name;
                            }
                            delete e.role_id;
                            delete e.manager_id;
                        }
                        printTable(employees);
                        promptInquirer();
                    });
                });
            } break;
            case "add an employee": {
                promptString("Employee First Name", (first_name) => {
                    promptString("Employee Last Name", (last_name) => {
                        getRoles((error, roles) => {
                            let choices = [];
                            roles.forEach(({ title, id }) => choices.push({ name: title, value: id }));
                            promptChoices("Pick a Role", choices, (role_id) => {
                                getEmployees((error, employees) => {
                                    choices = [{ name: "None", value: null }];
                                    employees.forEach(({ first_name: fn, last_name: ln, id }) => choices.push({ name: fn + " " + ln, value: id }));
                                    promptChoices("Pick The Manager", choices, (manager_id) => {
                                        addEmployee([first_name, last_name, role_id, manager_id], (error, data) => {
                                            data = `Added ${first_name + " " + last_name} to the database`;
                                            console.log(data);
                                            promptInquirer();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            } break;
            case "update employee role": {
                getEmployees((error, employees) => {
                    let choices = [];
                    employees.forEach(e => choices.push({ name: e.first_name + " " + e.last_name, value: e }));
                    promptChoices("Pick The Employee", choices, (employee) => {
                        getRoles((error, roles) => {
                            choices = [];
                            roles.forEach(r => choices.push({ name: r.title, value: r.id }));
                            promptChoices("Pick a Role", choices, (role_id) => {
                                updateEmployeeRole(employee.id, role_id, (error, data) => {
                                    data = `Updated ${employee.first_name + " " + employee.last_name} role`;
                                    console.log(data);
                                    promptInquirer();
                                });
                            });
                        });
                    });
                });
            } break;
        }
    }).catch((error) => {
        console.log(error);
    });
}

function promptChoices(message, choices, callback) {
    inquirer.prompt([{ type: 'list', name: 'prompt', message, choices, }]).then(({ prompt }) => callback(prompt));
}

function promptInteger(message, callback) {
    inquirer.prompt([{ type: 'input', name: 'integer', message }]).then(({ integer }) => callback(integer));
}

function promptString(message, callback) {
    inquirer.prompt([{ type: 'input', name: 'string', message }]).then(({ string }) => callback(string));
}

function getDepartments(callback) {
    db.query('SELECT * FROM department', callback);
}

function addDepartment(name, callback) {
    db.query('INSERT INTO department (name) VALUES (?)', name, callback);
}

function getRoles(callback) {
    db.query('SELECT * FROM role', callback);
}

function addRole(args, callback) {
    db.query('INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)', args, callback);
}

function getEmployees(callback) {
    db.query('SELECT * FROM employee', callback);
}

function addEmployee(args, callback) {
    db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)', args, callback);
}

function updateEmployeeRole(employee_id, role_id, callback) {
    db.query('UPDATE employee SET role_id = ? WHERE id = ?', [role_id, employee_id], callback);
}

promptInquirer();