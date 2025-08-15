#!/bin/bash
rm -rf /var/www/project-rose/repos/tvii-prod
cp -r /var/www/project-rose/repos/tvii-stg /var/www/project-rose/repos/tvii-prod
rm /var/www/project-rose/repos/tvii-prod/pushToProd.sh
docker compose -f /var/www/project-rose/compose.yml restart rose-tvii-prod
