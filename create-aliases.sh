alias restart="sudo docker-compose up --force-recreate -d"
alias hard-restart="sudo docker-compose down && docker system prune -a --volumes --force && restart"