-- KEYS[1]: the key to increment

-- ARGV[1]: the expiry time in seconds

-- Returns: the incremented value

-- Increment an existing key or insert a new one
local incremented = redis.call("INCR", KEYS[1])

-- `INCR` returns 1 if a new key was inserted
if incremented == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
end

return incremented
