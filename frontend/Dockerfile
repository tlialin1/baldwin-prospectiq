FROM nginx:alpine

# Copy only static files to the web root
COPY index.html /usr/share/nginx/html/index.html

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default PORT to 8080 if not set; nginx:alpine's entrypoint runs
# envsubst on /etc/nginx/templates/*.template automatically
ENV PORT=8080

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
