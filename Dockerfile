FROM node:18-alpine
RUN npm install -g http-server
WORKDIR /app
COPY . /app
EXPOSE 80
CMD ["http-server", "-p", "80"]
