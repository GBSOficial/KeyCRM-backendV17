import { z } from "zod";

export const userSchema = z.object({
    id: z.number().positive(),
    name: z.string().min(1),
    email: z.string().email('Email inválido').min(1),
    password: z.string().min(4, 'Senha deve ter pelo menos 4 caracteres'),
    offices: z.string(),
    department: z.string().nullable(),
    chatCode: z.string().nullable().optional(),
    chatCodeGenerations: z.number().default(0),
    img: z.string().nullable().optional()
})

export type TUser = z.infer<typeof userSchema>;

export const userRegisterBodySchema = userSchema.omit({ id: true});

export const userUpdateSchema = userRegisterBodySchema.partial();

export type TUserUpdate = z.infer<typeof userUpdateSchema>;

export type TUserRegisterBody = z.infer<typeof userRegisterBodySchema>;

export const userLoginBodySchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(4, 'Senha deve ter pelo menos 4 caracteres')
});

export type TUserLoginbody = z.infer<typeof userLoginBodySchema>;

export const userReturnSchema = userSchema.omit({ password: true});

export type TUserReturn = z.infer<typeof userReturnSchema>;

export type TUserLoginReturn = {
    accessToken: string;
    user: TUserReturn;
}



