INSERT INTO
	friends (transmitter_id, receiver_id)
VALUES (1, 2);

UPDATE
	friends
SET
	accepted_at = NOW()
WHERE
	  transmitter_id = 1
  AND receiver_id = 2;

