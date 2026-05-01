FROM nginx:alpine

# Copy only static files to the web root
COPY index.html /usr/share/nginx/html/index.html

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

ENV PORT=3000

CMD ["nginx", "-g", "daemon off;"]
