use mydb;

CREATE TABLE schedule_exception_groups (
    schedule_exception_id INT NOT NULL,
    group_id INT NOT NULL,

    PRIMARY KEY (
        schedule_exception_id,
        group_id
    ),

    FOREIGN KEY (schedule_exception_id)
        REFERENCES schedule_exceptions(id)
        ON DELETE CASCADE,

    FOREIGN KEY (group_id)
        REFERENCES `groups`(id)
        ON DELETE CASCADE
);