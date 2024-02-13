alias restart="sudo docker-compose up --force-recreate -d"
alias hard-restart="aws ecr get-login-password \
  --region us-east-1 | \
  sudo docker login \
  --username AWS \
  --password-stdin 992532056584.dkr.ecr.us-east-1.amazonaws.com &&
  sudo docker-compose down &&
  docker system prune -a --volumes --force &&
  restart"