FROM nginx:alpine

# Copy only static files to the web root
COPY index.html /usr/share/nginx/html/index.html

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Railway injects PORT at runtime. Default to 8080 if not set.
# nginx:alpine's entrypoint runs envsubst on /etc/nginx/templates/*.template,
# substituting ${PORT} in nginx.conf.template before nginx starts.
ENV PORT=8080

CMD ["nginx", "-g", "daemon off;"]
