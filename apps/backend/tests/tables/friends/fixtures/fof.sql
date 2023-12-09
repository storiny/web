INSERT INTO
	friends (transmitter_id, receiver_id)
VALUES (1, 3);

INSERT INTO
	friends (transmitter_id, receiver_id)
VALUES (2, 3);

UPDATE
	friends
SET
	accepted_at = NOW()
WHERE
	 (transmitter_id = 1
		 AND receiver_id = 3)
  OR (transmitter_id = 2
	AND receiver_id = 3);

