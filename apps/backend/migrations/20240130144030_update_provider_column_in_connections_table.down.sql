ALTER TABLE connections
	ALTER COLUMN provider TYPE SMALLINT
		USING (
		CASE provider
			WHEN 'github'
				THEN 1
			WHEN 'twitch'
				THEN 2
			WHEN 'spotify'
				THEN 3
			WHEN 'reddit'
				THEN 4
			WHEN 'facebook'
				THEN 5
			WHEN 'instagram'
				THEN 6
			WHEN 'discord'
				THEN 7
			WHEN 'youtube'
				THEN 8
			WHEN 'linkedin'
				THEN 9
			WHEN 'figma'
				THEN 10
			WHEN 'dribbble'
				THEN 11
			WHEN 'snapchat'
				THEN 12
			ELSE 0
		END
		)
