FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default PORT to 8080 if not set; nginx:alpine's entrypoint runs
# envsubst on /etc/nginx/templates/*.template automatically
ENV PORT=8080

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
