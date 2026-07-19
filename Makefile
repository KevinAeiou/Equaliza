# Configuração inicial
docker_setup:
	test -f backend/.env || cp backend/.env.example backend/.env
	docker volume create equaliza_dbdata || true

# Subir containers em modo desenvolvimento
docker_dev: docker_setup
	docker compose -f docker-compose.dev.yml build
	docker compose -f docker-compose.dev.yml up -d
	docker compose -f docker-compose.dev.yml exec backend python manage.py migrate --fake-initial

# Subir containers em modo produção
docker_prod: docker_setup
	docker compose -f docker-compose.prod.yml build
	docker compose -f docker-compose.prod.yml up -d
	docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
	sudo docker restart equaliza-nginx-1

# Forçar rebuild limpo (apenas quando necessário)
docker_rebuild_dev:
	docker compose -f docker-compose.dev.yml build --no-cache
	docker compose -f docker-compose.dev.yml up -d

docker_rebuild_prod:
	docker compose -f docker-compose.prod.yml build --no-cache
	docker compose -f docker-compose.prod.yml up -d
	sudo docker restart equaliza-nginx-1

# Limpeza de containers, volumes e imagens antigas
docker_clean:
	docker system prune -af --volumes
