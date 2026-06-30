-- ======================
-- BLOCK 1 (TEXT TAL)
-- ======================

INSERT INTO blocks (id, name) VALUES (1, 'Taluppfattning');

INSERT INTO questions VALUES (NULL,'Skriv $1\\,074\\,000$ med ord.',1,1,JSON_OBJECT('mode', 'text'));
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$\\text{en miljon sjuttiofyra tusen}$',1);

/*
INSERT INTO questions VALUES (NULL,'Skriv $1\\,200\\,000$ med ord.',1,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$\\text{en miljon tvåhundra tusen}$',1);

INSERT INTO questions VALUES (NULL,'Skriv $900\\,000$ med ord.',1,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$\\text{niohundra tusen}$',1);

INSERT INTO questions VALUES (NULL,'Skriv $2\\,300\\,000$ med ord.',1,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$\\text{två miljoner trehundra tusen}$',1);

INSERT INTO questions VALUES (NULL,'Skriv $1\\,050\\,000$ med ord.',1,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$\\text{en miljon femtio tusen}$',1);
*/

-- ======================
-- BLOCK 2 (TALLINJE MCQ)
-- ======================

INSERT INTO blocks (id, name) VALUES (2, 'Taluppfattning');

INSERT INTO questions VALUES (NULL,'Vilket tal är närmast $35$?',2,3,null);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES
(NULL,@q,'$34$',1),
(NULL,@q,'$36$',1),
(NULL,@q,'$45$',0);

/*
INSERT INTO questions VALUES (NULL,'Vilket tal är närmast $30$?',2,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES
(NULL,@q,'$30$',1),
(NULL,@q,'$25$',0),
(NULL,@q,'$35$',0);

INSERT INTO questions VALUES (NULL,'Vilket tal ligger mitt mellan $20$ och $40$?',2,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES
(NULL,@q,'$30$',1),
(NULL,@q,'$20$',0),
(NULL,@q,'$40$',0);

INSERT INTO questions VALUES (NULL,'Vilket tal ligger mellan $10$ och $20$?',2,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES
(NULL,@q,'$15$',1),
(NULL,@q,'$10$',0),
(NULL,@q,'$20$',0);

INSERT INTO questions VALUES (NULL,'Vilket tal är störst av $40,45,50$?',2,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES
(NULL,@q,'$50$',1),
(NULL,@q,'$45$',0),
(NULL,@q,'$40$',0);

*/

-- ======================
-- BLOCK 3 (ARITMETIK)
-- ======================

INSERT INTO blocks (id, name) VALUES (3, 'Aritmetik');

INSERT INTO questions VALUES (NULL,'$11\\cdot2+5$',3,1,JSON_OBJECT('mode', 'numeric'));
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$27$',1);

/*
INSERT INTO questions VALUES (NULL,'$12\\cdot2+3$',3,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$27$',1);

INSERT INTO questions VALUES (NULL,'$9\\cdot3+2$',3,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$29$',1);

INSERT INTO questions VALUES (NULL,'$8\\cdot4+1$',3,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$33$',1);

INSERT INTO questions VALUES (NULL,'$7\\cdot5+3$',3,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$38$',1);
*/

-- ======================
-- BLOCK 4 (NEGATIVA TAL)
-- ======================

INSERT INTO blocks (id, name) VALUES (4, 'Aritmetik');

INSERT INTO questions VALUES (NULL,'$-3-17$',4,1,JSON_OBJECT('mode', 'numeric'));
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$-20$',1);

/*
INSERT INTO questions VALUES (NULL,'$-5-10$',4,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$-15$',1);

INSERT INTO questions VALUES (NULL,'$-8+3$',4,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$-5$',1);

INSERT INTO questions VALUES (NULL,'$-6-6$',4,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$-12$',1);

INSERT INTO questions VALUES (NULL,'$-10+5$',4,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$-5$',1);
*/
/*
-- ======================
-- BLOCK 5 (DECIMAL MCQ)
-- ======================

INSERT INTO questions VALUES (NULL,'Vilket tal är störst: $0,74,0,78,0,7$?',5,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$0,78$',1),(NULL,@q,'$0,74$',0),(NULL,@q,'$0,7$',0);

INSERT INTO questions VALUES (NULL,'Vilket tal är störst: $0,65,0,68,0,6$?',5,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$0,68$',1),(NULL,@q,'$0,65$',0),(NULL,@q,'$0,6$',0);

-- ======================
-- BLOCK 6 (DIVISION MCQ)
-- ======================

INSERT INTO questions VALUES (NULL,'Vad händer när man dividerar med $0,001$?',6,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'Mycket större',1),(NULL,@q,'Mindre',0),(NULL,@q,'Samma',0);

INSERT INTO questions VALUES (NULL,'Vad händer när man dividerar med $0,1$?',6,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'Större',1),(NULL,@q,'Mindre',0),(NULL,@q,'Samma',0);

-- ======================
-- BLOCK 8 (DECIMAL)
-- ======================

INSERT INTO questions VALUES (NULL,'$0,5\\cdot36$',8,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$18$',1);

INSERT INTO questions VALUES (NULL,'$0,04\\cdot0,4$',8,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$0,016$',1);

-- ======================
-- BLOCK 9 (GRUNDPOTENS)
-- ======================

INSERT INTO questions VALUES (NULL,'$0,038$ i grundpotensform',9,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$3,8\\cdot10^{-2}$',1);

-- ======================
-- BLOCK 10 (BRÅK)
-- ======================

INSERT INTO questions VALUES (NULL,'Vilket bråk är störst?',10,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES
(NULL,@q,'$\\frac{5}{2}$',1),
(NULL,@q,'$\\frac{7}{4}$',0),
(NULL,@q,'$\\frac{13}{6}$',0);

-- ======================
-- BLOCK 11 (PROCENT)
-- ======================

INSERT INTO questions VALUES (NULL,'$300$ kr med $50\\%$',11,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$450$',1),(NULL,@q,'$400$',0),(NULL,@q,'$500$',0);

-- ======================
-- BLOCK 12 (PROCENTÖKNING)
-- ======================

INSERT INTO questions VALUES (NULL,'$20 \\rightarrow 25$',12,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$25\\%$',1),(NULL,@q,'$20\\%$',0),(NULL,@q,'$30\\%$',0);

-- ======================
-- BLOCK 13 (PROCENT MINSKNING)
-- ======================

INSERT INTO questions VALUES (NULL,'$7\\%$ minskning av $235$',13,2);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$235\\cdot0,93$',1),(NULL,@q,'$235\\cdot1,07$',0),(NULL,@q,'$235\\cdot0,07$',0);

-- ======================
-- BLOCK 14 (PROCENT)
-- ======================

INSERT INTO questions VALUES (NULL,'$15\\%$ av $200$',14,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$30$',1);

-- ======================
-- BLOCK 15 (EKVATION)
-- ======================

INSERT INTO questions VALUES (NULL,'$x-3=2x+10$',15,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$x=-13$',1);

-- ======================
-- BLOCK 16 (FÖRENKLA)
-- ======================

INSERT INTO questions VALUES (NULL,'$20x+8-11-3x$',16,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$17x-3$',1);

-- ======================
-- BLOCK 17 (OMKRETS)
-- ======================

INSERT INTO questions VALUES (NULL,'Omkrets $b$ och $5$',17,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$2b+10$',1);

-- ======================
-- BLOCK 18 (AREA)
-- ======================

INSERT INTO questions VALUES (NULL,'Area $b$ och $5$',18,1);
SET @q = LAST_INSERT_ID();
INSERT INTO options VALUES (NULL,@q,'$5b$',1);
*/
-- ======================
-- EXAM BLOCKS
-- ======================

INSERT INTO exams VALUES(1,'Förkunskapstest','ABC');

INSERT INTO exam_blocks VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),
(1,8),(1,9),(1,10),(1,11),(1,12),
(1,13),(1,14),(1,15),(1,16),(1,17),(1,18);