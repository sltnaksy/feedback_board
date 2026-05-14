# Frontend image based on nginx.
# Static files and nginx configuration are copied into the runtime image.
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html

EXPOSE 80