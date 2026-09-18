import StoreInfo from '../models/StoreInfo.js';
import StoreInfoSql from '../modelsSql/StoreInfo.js';
import { serializeStoreInfo } from '../utils/serializers.js';

// Documento único (singleton): el id siempre es 1 en ambos motores
const STORE_INFO_ID = 1;

// Directo de fábrica hasta que el administrador guarde sus propios datos
const DEFAULT_STORE_INFO = {
    id: String(STORE_INFO_ID),
    name: 'UALab',
    description: '',
    address: '',
    phone: '',
    email: '',
    whatsapp: '',
    logo: '',
    hours: '',
    social: {
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: ''
    }
};

const TEXT_FIELDS = ['name', 'description', 'address', 'phone', 'email', 'whatsapp', 'logo', 'hours'];
const SOCIAL_NETWORKS = ['facebook', 'instagram', 'twitter', 'linkedin'];

// Combina los datos actuales con los recibidos (merge parcial, incluidas las redes)
function mergeStoreInfo(base, data) {
    const merged = {};

    for (const field of TEXT_FIELDS) {
        merged[field] = data[field] !== undefined ? data[field] : base[field];
    }

    merged.social = {};

    for (const network of SOCIAL_NETWORKS) {
        merged.social[network] = data.social?.[network] !== undefined ? data.social[network] : (base.social?.[network] ?? '');
    }

    return merged;
}

// Convierte los campos ya combinados en columnas SQL (las redes van desnormalizadas)
function toSqlColumns(storeInfo) {
    return {
        name: storeInfo.name,
        description: storeInfo.description,
        address: storeInfo.address,
        phone: storeInfo.phone,
        email: storeInfo.email,
        whatsapp: storeInfo.whatsapp,
        logo: storeInfo.logo,
        hours: storeInfo.hours,
        facebook: storeInfo.social.facebook,
        instagram: storeInfo.social.instagram,
        twitter: storeInfo.social.twitter,
        linkedin: storeInfo.social.linkedin
    };
}

function defaultStoreInfo() {
    return { ...DEFAULT_STORE_INFO, social: { ...DEFAULT_STORE_INFO.social } };
}

class MongoStoreInfoRepository {
    async get() {
        const storeInfo = await StoreInfo.findById(STORE_INFO_ID);

        return storeInfo ? serializeStoreInfo(storeInfo) : defaultStoreInfo();
    }

    async update(data) {
        const current = await StoreInfo.findById(STORE_INFO_ID);
        const base = current ? serializeStoreInfo(current) : defaultStoreInfo();
        const merged = mergeStoreInfo(base, data);

        const updated = await StoreInfo.findOneAndUpdate(
            { _id: STORE_INFO_ID },
            { $set: merged },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        return serializeStoreInfo(updated);
    }
}

class SqlStoreInfoRepository {
    async get() {
        const storeInfo = await StoreInfoSql.findByPk(STORE_INFO_ID);

        return storeInfo ? serializeStoreInfo(storeInfo) : defaultStoreInfo();
    }

    async update(data) {
        const current = await StoreInfoSql.findByPk(STORE_INFO_ID);
        const base = current ? serializeStoreInfo(current) : defaultStoreInfo();
        const merged = mergeStoreInfo(base, data);
        const columns = toSqlColumns(merged);

        const storeInfo = current
            ? await current.update(columns)
            : await StoreInfoSql.create({ id: STORE_INFO_ID, ...columns });

        return serializeStoreInfo(storeInfo);
    }
}

export function getStoreInfoRepository() {
    return process.env.DB_TYPE === 'sql' ? new SqlStoreInfoRepository() : new MongoStoreInfoRepository();
}
