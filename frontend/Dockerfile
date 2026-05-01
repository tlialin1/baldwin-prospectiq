FROM nginx:alpine

# Copy static files
COPY index.html /usr/share/nginx/html/index.html

# Create nginx config that listens on Railway's expected port
RUN echo 'server { listen ${PORT}; server_name _; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

# Use shell to substitute PORT env var
CMD sh -c 'sed -i "s/\${PORT}/$PORT/g" /etc/nginx/conf.d/default.conf && nginx -g "daemon off;"'
