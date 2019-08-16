export NODE_ENV=production

if [ -d dist/ ]
then
    rm -r dist/
fi

parcel build \
    --no-cache \
    --no-source-maps \
    --public-url=/prototype-tree \
    index.html

npm run parse

cp ctors.*.json dist/
