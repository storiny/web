ALTER TABLE connections
	ALTER COLUMN provider TYPE TEXT
		USING (
		CASE provider
			WHEN 1
				THEN 'github'
			WHEN 2
				THEN 'twitch'
			WHEN 3
				THEN 'spotify'
			WHEN 4
				THEN 'reddit'
			WHEN 5
				THEN 'facebook'
			WHEN 6
				THEN 'instagram'
			WHEN 7
				THEN 'discord'
			WHEN 8
				THEN 'youtube'
			WHEN 9
				THEN 'linkedin'
			WHEN 10
				THEN 'figma'
			WHEN 11
				THEN 'dribbble'
			WHEN 12
				THEN 'snapchat'
			ELSE 'unknown'
		END
		)
